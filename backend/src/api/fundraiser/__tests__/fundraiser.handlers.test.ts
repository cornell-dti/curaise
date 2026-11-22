import { Decimal } from "decimal.js";
import {
  mockResponse,
  createMockOrganization,
  createMockUser,
} from "../../../__tests__";
import {
  getFundraiserCostsHandler,
  getFundraiserItemsHandler,
  updateFundraiserItemHandler,
} from "../fundraiser.handlers";
import * as fundraiserServices from "../fundraiser.services";

jest.mock("../fundraiser.services");
jest.mock("../../../utils/email", () => ({
  sendAnnouncementEmail: jest.fn(),
  sendVenmoSetupEmail: jest.fn(),
}));

const adminId = "123e4567-e89b-12d3-a456-426614174000";
const strangerId = "123e4567-e89b-12d3-a456-426614174009";
const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";
const itemId = "523e4567-e89b-12d3-a456-426614174000";

const fundraiser = {
  id: fundraiserId,
  published: true,
  organization: {
    ...createMockOrganization(),
    admins: [createMockUser({ id: adminId })],
  },
};

const dbItem = {
  id: itemId,
  name: "Cookie",
  description: "Chocolate chip",
  price: new Decimal(3),
  unitCost: new Decimal(1.25),
  imageUrl: null,
  offsale: false,
  limit: null,
  category: "DESSERTS",
  fundraiserId,
};

describe("Fundraiser cost handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fundraiserServices.getFundraiser as jest.Mock).mockResolvedValue(fundraiser);
  });

  describe("getFundraiserCostsHandler", () => {
    const req: any = { params: { id: fundraiserId } };

    it("returns costs to org admins", async () => {
      (fundraiserServices.getFundraiserCosts as jest.Mock).mockResolvedValue({
        expenses: new Decimal(40),
        items: [{ id: itemId, unitCost: new Decimal(1.25) }],
      });
      const res = mockResponse();
      res.locals.user = { id: adminId };

      await getFundraiserCostsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { data } = res.json.mock.calls[0][0];
      expect(Number(data.expenses)).toBe(40);
      expect(Number(data.items[0].unitCost)).toBe(1.25);
    });

    it("rejects non-admins", async () => {
      const res = mockResponse();
      res.locals.user = { id: strangerId };

      await getFundraiserCostsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(fundraiserServices.getFundraiserCosts).not.toHaveBeenCalled();
    });
  });

  it("never exposes unit cost on the public items endpoint", async () => {
    (fundraiserServices.getFundraiserItems as jest.Mock).mockResolvedValue([dbItem]);
    const res = mockResponse();

    await getFundraiserItemsHandler({ params: { id: fundraiserId } } as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data[0]).not.toHaveProperty("unitCost");
  });

  it("allows editing unit cost on a published fundraiser and invalidates analytics", async () => {
    (fundraiserServices.getFundraiserItemForFundraiser as jest.Mock).mockResolvedValue(dbItem);
    (fundraiserServices.validatePublishedFundraiserItemUpdate as jest.Mock).mockReturnValue({
      valid: true,
    });
    (fundraiserServices.updateFundraiserItem as jest.Mock).mockResolvedValue({
      ...dbItem,
      unitCost: new Decimal(2),
    });
    const res = mockResponse();
    res.locals.user = { id: adminId };

    await updateFundraiserItemHandler(
      {
        params: { fundraiserId, itemId },
        body: {
          name: "Cookie",
          description: "Chocolate chip",
          price: new Decimal(3),
          offsale: false,
          unitCost: new Decimal(2),
          category: "DESSERTS",
        },
      } as any,
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Number(res.json.mock.calls[0][0].data.unitCost)).toBe(2);
    expect(fundraiserServices.invalidateFundraiserAnalyticsCache).toHaveBeenCalledWith(
      fundraiserId
    );
  });
});
