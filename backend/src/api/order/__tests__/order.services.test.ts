import { Decimal } from "decimal.js";
import { prismaMock, createMockUser, createMockOrder } from "../../../__tests__";
import {
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
    // $transaction just runs the callback against the same mocked client
    prismaMock.$transaction.mockImplementation(((callback: any) =>
      callback(prismaMock)) as any);
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
        data: { paidAmount: 15.5, paymentMismatchAt: expect.any(Date) },
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
