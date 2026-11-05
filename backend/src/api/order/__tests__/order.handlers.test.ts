import {
  mockResponse,
  createMockOrder,
  createMockOrganization,
  createMockUser,
} from "../../../__tests__";
import { createOrderHandler } from "../order.handlers";
import * as orderServices from "../order.services";
import * as fundraiserServices from "../../fundraiser/fundraiser.services";

jest.mock("../order.services");
jest.mock("../../fundraiser/fundraiser.services");
jest.mock("../../../utils/email", () => ({
  sendOrderConfirmation: jest.fn(),
}));

const adminId = "123e4567-e89b-12d3-a456-426614174000";
const buyerId = "123e4567-e89b-12d3-a456-426614174001";
const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";
const itemId = "523e4567-e89b-12d3-a456-426614174000";

describe("Order Handlers", () => {
  describe("createOrderHandler after the buying period has ended", () => {
    let mockRes: ReturnType<typeof mockResponse>;

    const closedFundraiser = {
      id: fundraiserId,
      name: "Test Fundraiser",
      description: "A test fundraiser",
      published: true,
      buyingStartsAt: new Date("2024-01-01"),
      buyingEndsAt: new Date("2024-01-31"),
      imageUrls: [],
      pickupEvents: [],
      organization: {
        ...createMockOrganization(),
        admins: [createMockUser({ id: adminId })],
      },
    };

    const orderBody = {
      fundraiserId,
      items: [{ itemId, quantity: 1 }],
      payment_method: "OTHER" as const,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockRes = mockResponse();
      (fundraiserServices.getFundraiser as jest.Mock).mockResolvedValue(
        closedFundraiser
      );
    });

    it("should create a seller's manual order", async () => {
      mockRes.locals.user = { id: adminId };
      const mockReq: any = {
        body: {
          ...orderBody,
          markAsPickedUp: true,
          buyerName: "Jane Doe",
          buyerNetId: "jd123",
        },
      };
      (orderServices.createOrder as jest.Mock).mockResolvedValue({
        ...createMockOrder({
          paymentMethod: "OTHER",
          paymentStatus: "UNVERIFIABLE",
          pickedUp: true,
          buyerName: "Jane Doe",
          buyerNetId: "jd123",
        }),
        buyer: createMockUser({ id: adminId }),
        fundraiser: closedFundraiser,
        referral: null,
      });

      await createOrderHandler(mockReq, mockRes);

      expect(orderServices.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerId: adminId,
          buyerName: "Jane Doe",
          buyerNetId: "jd123",
          markAsPickedUp: true,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it.each([
      ["a buyer", buyerId],
      ["a seller buying for themselves", adminId],
    ])("should reject an order from %s", async (_, userId) => {
      mockRes.locals.user = { id: userId };
      const mockReq: any = { body: orderBody };

      await createOrderHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Fundraiser buying period has ended",
      });
      expect(orderServices.createOrder).not.toHaveBeenCalled();
    });
  });
});
