import { prismaMock } from "../../../__tests__";
import {
  PAID_OR_PICKED_UP,
  getReferrerOrderCountsForOrganization,
  getReferrerOrdersForFundraiser,
} from "../fundraiser.services";

jest.mock("../../../utils/memjs", () => ({
  __esModule: true,
  default: {},
}));

const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";
const otherFundraiserId = "423e4567-e89b-12d3-a456-426614174001";
const referrerId = "523e4567-e89b-12d3-a456-426614174000";
const referralId = "623e4567-e89b-12d3-a456-426614174000";
const otherReferralId = "623e4567-e89b-12d3-a456-426614174001";
const organizationId = "223e4567-e89b-12d3-a456-426614174000";

describe("Referrer services", () => {
  describe("getReferrerOrdersForFundraiser", () => {
    it("returns null when this person has no referral on the fundraiser", async () => {
      prismaMock.referral.findUnique.mockResolvedValue(null);

      const result = await getReferrerOrdersForFundraiser(
        fundraiserId,
        referrerId
      );

      expect(result).toBeNull();
      expect(prismaMock.order.findMany).not.toHaveBeenCalled();
    });

    it("loads only confirmed or picked-up orders for that referral", async () => {
      prismaMock.referral.findUnique.mockResolvedValue({
        id: referralId,
        referrer: { id: referrerId, name: "Ada", email: "ada@cornell.edu" },
        fundraiser: { id: fundraiserId, organization: { id: organizationId, admins: [] } },
      } as any);
      prismaMock.order.findMany.mockResolvedValue([] as any);

      await getReferrerOrdersForFundraiser(fundraiserId, referrerId);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fundraiserId,
            referralId,
            ...PAID_OR_PICKED_UP,
          },
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("getReferrerOrderCountsForOrganization", () => {
    it("returns an empty list when the referrer has no referrals in the org", async () => {
      prismaMock.referral.findMany.mockResolvedValue([]);

      const result = await getReferrerOrderCountsForOrganization(
        organizationId,
        referrerId
      );

      expect(result).toEqual([]);
      expect(prismaMock.order.groupBy).not.toHaveBeenCalled();
    });

    it("counts confirmed or picked-up orders and keeps fundraisers with zero", async () => {
      prismaMock.referral.findMany.mockResolvedValue([
        {
          id: referralId,
          referrerId,
          fundraiser: { id: fundraiserId, name: "Cookies" },
        },
        {
          id: otherReferralId,
          referrerId,
          fundraiser: { id: otherFundraiserId, name: "Bake sale" },
        },
      ] as any);
      (prismaMock.order.groupBy as unknown as jest.Mock).mockResolvedValue([
        { referralId, _count: { _all: 2 } },
      ]);

      const result = await getReferrerOrderCountsForOrganization(
        organizationId,
        referrerId
      );

      expect(prismaMock.referral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fundraiser: { organizationId },
            referrerId,
          },
        })
      );
      expect(prismaMock.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            referralId: { in: [referralId, otherReferralId] },
            ...PAID_OR_PICKED_UP,
          },
        })
      );
      expect(result).toEqual([
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
    });
  });
});
