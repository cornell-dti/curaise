import { Decimal } from "decimal.js";
import {
  mockResponse,
  createMockUser,
  createMockOrganization,
  createMockSupabaseUser,
} from "../../../__tests__";
import {
  getReferrerOrdersHandler,
  getReferrerOtherFundraisersHandler,
} from "../fundraiser.handlers";
import * as fundraiserServices from "../fundraiser.services";

jest.mock("../fundraiser.services");
jest.mock("../../../utils/memjs", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("../../../utils/email", () => ({
  sendAnnouncementEmail: jest.fn(),
  sendVenmoSetupEmail: jest.fn(),
}));

const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";
const otherFundraiserId = "423e4567-e89b-12d3-a456-426614174001";
const referrerId = "523e4567-e89b-12d3-a456-426614174000";
const adminId = "123e4567-e89b-12d3-a456-426614174000";
const strangerId = "123e4567-e89b-12d3-a456-426614174009";

const referrer = createMockUser({
  id: referrerId,
  email: "ada@cornell.edu",
  name: "Ada",
});

const organization = {
  ...createMockOrganization(),
  admins: [{ id: adminId }],
};

function referralRecord() {
  return {
    id: "623e4567-e89b-12d3-a456-426614174000",
    referrer,
    fundraiser: {
      id: fundraiserId,
      organization,
    },
  };
}

function countedOrder() {
  return {
    id: "723e4567-e89b-12d3-a456-426614174000",
    paymentMethod: "VENMO",
    paymentStatus: "CONFIRMED",
    pickedUp: false,
    paidAmount: null,
    paymentMismatchAt: null,
    buyerName: null,
    buyerNetId: null,
    createdAt: new Date("2024-02-01T00:00:00.000Z"),
    updatedAt: new Date("2024-02-01T00:00:00.000Z"),
    buyer: referrer,
    fundraiser: {
      id: fundraiserId,
      name: "Cookies",
      description: "A sale",
      published: true,
      goalAmount: new Decimal("100.00"),
      venmoUsername: null,
      venmoEmail: null,
      imageUrls: ["https://example.com/image.jpg"],
      buyingStartsAt: new Date("2024-01-01T00:00:00.000Z"),
      buyingEndsAt: new Date("2024-12-31T00:00:00.000Z"),
      organization: createMockOrganization(),
      pickupEvents: [],
    },
    items: [
      {
        quantity: 2,
        item: {
          id: "823e4567-e89b-12d3-a456-426614174000",
          name: "Cookie",
          description: "Chocolate",
          price: new Decimal("5.00"),
          limit: null,
          category: "DESSERTS",
          imageUrl: null,
          offsale: false,
        },
      },
    ],
    referral: {
      id: "623e4567-e89b-12d3-a456-426614174000",
      approved: true,
      referrer,
    },
  };
}

describe("Referrer handlers", () => {
  let mockRes: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    mockRes = mockResponse();
    jest.clearAllMocks();
  });

  describe("getReferrerOrdersHandler", () => {
    const req: any = { params: { fundraiserId, referrerId } };

    it("returns 404 when the person is not a referrer on this fundraiser", async () => {
      (
        fundraiserServices.getReferrerOrdersForFundraiser as jest.Mock
      ).mockResolvedValue(null);

      await getReferrerOrdersHandler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Referral not found",
      });
    });

    it("returns 403 when the caller is not an org admin", async () => {
      mockRes.locals.user = createMockSupabaseUser(strangerId);
      (
        fundraiserServices.getReferrerOrdersForFundraiser as jest.Mock
      ).mockResolvedValue({
        referrer,
        orders: [],
        fundraiser: referralRecord().fundraiser,
      });

      await getReferrerOrdersHandler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized to view referrer orders",
      });
    });

    it("returns the referrer and counted orders for an org admin", async () => {
      mockRes.locals.user = createMockSupabaseUser(adminId);
      (
        fundraiserServices.getReferrerOrdersForFundraiser as jest.Mock
      ).mockResolvedValue({
        referrer,
        orders: [countedOrder()],
        fundraiser: referralRecord().fundraiser,
      });

      await getReferrerOrdersHandler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Referrer orders retrieved",
        data: expect.objectContaining({
          referrer: expect.objectContaining({ id: referrerId, name: "Ada" }),
          orders: [expect.objectContaining({ id: countedOrder().id })],
        }),
      });
    });
  });

  describe("getReferrerOtherFundraisersHandler", () => {
    const req: any = { params: { fundraiserId, referrerId } };

    it("returns 404 when the person is not a referrer on this fundraiser", async () => {
      (
        fundraiserServices.getReferralByFundraiserAndReferrer as jest.Mock
      ).mockResolvedValue(null);

      await getReferrerOtherFundraisersHandler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when the caller is not an org admin", async () => {
      mockRes.locals.user = createMockSupabaseUser(strangerId);
      (
        fundraiserServices.getReferralByFundraiserAndReferrer as jest.Mock
      ).mockResolvedValue(referralRecord());

      await getReferrerOtherFundraisersHandler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized to view referrer fundraisers",
      });
    });

    it("lists other org fundraisers and omits the current one", async () => {
      mockRes.locals.user = createMockSupabaseUser(adminId);
      (
        fundraiserServices.getReferralByFundraiserAndReferrer as jest.Mock
      ).mockResolvedValue(referralRecord());
      (
        fundraiserServices.getReferrerOrderCountsForOrganization as jest.Mock
      ).mockResolvedValue([
        {
          fundraiserId,
          fundraiserName: "Cookies",
          referrerId,
          orderCount: 2,
        },
        {
          fundraiserId: otherFundraiserId,
          fundraiserName: "Bake sale",
          referrerId,
          orderCount: 0,
        },
      ]);

      await getReferrerOtherFundraisersHandler(req, mockRes);

      expect(
        fundraiserServices.getReferrerOrderCountsForOrganization
      ).toHaveBeenCalledWith(organization.id, referrerId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Referrer fundraisers retrieved",
        data: [
          {
            fundraiserId: otherFundraiserId,
            fundraiserName: "Bake sale",
            orderCount: 0,
          },
        ],
      });
    });
  });
});
