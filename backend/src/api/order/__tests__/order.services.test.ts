import { Decimal } from "decimal.js";
import { prismaMock, createMockUser, createMockOrder } from "../../../__tests__";
import { CreateOrderBody } from "common";
import {
  createOrder,
  confirmOrderPayment,
  recordOrderPaymentMismatch,
  getUnremindedUnpaidOrders,
} from "../order.services";
import * as fundraiserServices from "../../fundraiser/fundraiser.services";

jest.mock("../../fundraiser/fundraiser.services");

const orderId = "323e4567-e89b-12d3-a456-426614174000";
const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";

describe("Order Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // $transaction just runs the callback against the same mocked client
    prismaMock.$transaction.mockImplementation(((callback: any) =>
      callback(prismaMock)) as any);
  });

  describe("createOrder", () => {
    const itemId = "523e4567-e89b-12d3-a456-426614174000";
    const adminId = "123e4567-e89b-12d3-a456-426614174000";

    beforeEach(() => {
      prismaMock.item.findMany.mockResolvedValue([
        { id: itemId, limit: null, name: "Cookie" },
      ] as any);
      (prismaMock.orderItems.groupBy as unknown as jest.Mock).mockResolvedValue(
        []
      );
      prismaMock.order.create.mockResolvedValue(
        createMockOrder({ id: orderId }) as any
      );
    });

    it("should record the seller-entered buyer on a manual order", async () => {
      await createOrder({
        fundraiserId,
        items: [{ itemId, quantity: 2 }],
        payment_method: "OTHER",
        markAsPickedUp: true,
        buyerName: "Jane Doe",
        buyerNetId: "jd123",
        buyerId: adminId,
      });

      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyerName: "Jane Doe",
            buyerNetId: "jd123",
            buyer: { connect: { id: adminId } },
          }),
        })
      );
    });

    it("should leave buyer details empty for a regular order", async () => {
      await createOrder({
        fundraiserId,
        items: [{ itemId, quantity: 1 }],
        payment_method: "VENMO",
        buyerId: adminId,
      });

      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyerName: undefined,
            buyerNetId: undefined,
          }),
        })
      );
    });
  });

  describe("CreateOrderBody buyer fields", () => {
    const body = {
      fundraiserId,
      items: [{ itemId: "523e4567-e89b-12d3-a456-426614174000", quantity: 1 }],
      payment_method: "OTHER" as const,
    };

    it("should normalize the NetID", () => {
      const parsed = CreateOrderBody.parse({
        ...body,
        buyerName: " Jane Doe ",
        buyerNetId: " JD123 ",
      });

      expect(parsed.buyerName).toBe("Jane Doe");
      expect(parsed.buyerNetId).toBe("jd123");
    });

    it.each([
      [{ buyerName: "Jane Doe" }],
      [{ buyerNetId: "jd123" }],
      [{ buyerName: "Jane Doe", buyerNetId: "jd123@cornell.edu" }],
    ])("should reject incomplete or invalid buyer details (%o)", (fields) => {
      expect(CreateOrderBody.safeParse({ ...body, ...fields }).success).toBe(
        false
      );
    });
  });

  describe("confirmOrderPayment", () => {
    it("should throw when the order doesn't exist", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(confirmOrderPayment(orderId)).rejects.toThrow(
        "Order not found"
      );
    });

    it.each([
      [undefined, { paymentStatus: "CONFIRMED" as const }],
      [
        "VENMO" as const,
        { paymentStatus: "CONFIRMED" as const, paymentMethod: "VENMO" as const },
      ],
    ])(
      "should confirm the order, refreshing the cache (paymentMethod=%s)",
      async (paymentMethod, expectedData) => {
        prismaMock.order.findUnique.mockResolvedValue({
          ...createMockOrder({ id: orderId }),
          items: [],
        } as any);
        const confirmedOrder = {
          ...createMockOrder({ id: orderId, ...expectedData }),
          buyer: createMockUser(),
          fundraiser: { id: fundraiserId },
        };
        prismaMock.order.update.mockResolvedValue(confirmedOrder as any);

        const result = await confirmOrderPayment(orderId, paymentMethod);

        expect(prismaMock.order.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: orderId }, data: expectedData })
        );
        expect(result).toEqual(confirmedOrder);
        expect(
          fundraiserServices.updateCacheForOrderConfirmation
        ).toHaveBeenCalledWith(fundraiserId, confirmedOrder);
      }
    );

    it("should not update or re-count the cache when the order is already confirmed", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        ...createMockOrder({ id: orderId, paymentStatus: "CONFIRMED" }),
        items: [],
      } as any);
      const existingOrder = {
        ...createMockOrder({ id: orderId, paymentStatus: "CONFIRMED" }),
        buyer: createMockUser(),
        fundraiser: { id: fundraiserId },
      };
      prismaMock.order.findUniqueOrThrow.mockResolvedValue(existingOrder as any);

      const result = await confirmOrderPayment(orderId, "VENMO");

      expect(result).toEqual(existingOrder);
      expect(prismaMock.order.update).not.toHaveBeenCalled();
      expect(
        fundraiserServices.updateCacheForOrderConfirmation
      ).not.toHaveBeenCalled();
    });

    it("should reject when a limited item is already sold out", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        ...createMockOrder({ id: orderId }),
        items: [{ itemId: "item-1", quantity: 1 }],
      } as any);
      prismaMock.item.findMany.mockResolvedValue([
        { id: "item-1", limit: 1, name: "Limited Item" } as any,
      ]);
      (prismaMock.orderItems.groupBy as jest.Mock).mockResolvedValue([
        { itemId: "item-1", _sum: { quantity: 1 } },
      ]);

      await expect(confirmOrderPayment(orderId)).rejects.toThrow(
        "Insufficient stock for Limited Item"
      );
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });
  });

  describe("recordOrderPaymentMismatch", () => {
    it("should store the paid amount and a mismatch timestamp", async () => {
      const mismatchedOrder = {
        ...createMockOrder({ id: orderId }),
        buyer: createMockUser(),
        fundraiser: { id: fundraiserId, name: "Test Fundraiser" },
      };
      prismaMock.order.update.mockResolvedValue(mismatchedOrder as any);

      const result = await recordOrderPaymentMismatch(
        orderId,
        new Decimal("15.50")
      );

      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { paidAmount: "15.50", paymentMismatchAt: expect.any(Date) },
        include: {
          buyer: true,
          fundraiser: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mismatchedOrder);
    });
  });

  describe("getUnremindedUnpaidOrders", () => {
    it("should exclude orders already flagged with a payment mismatch", async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      await getUnremindedUnpaidOrders();

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentStatus: "PENDING",
            paymentMethod: "VENMO",
            paymentMismatchAt: null,
          }),
        })
      );
    });
  });
});
