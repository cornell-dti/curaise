import { describe, expect, it } from "vitest";
import { computeReferralStats, type ReferralStatsOrder } from "./referral-stats";

const maya = {
  id: "2a9e2861-1a8b-5ce6-b3be-c75a197ef1ad",
  approved: true,
  referrer: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    email: "mc100@cornell.edu",
  },
};
const ethan = {
  id: "3e5737ab-831f-513c-be9e-388e01c194e8",
  approved: true,
  referrer: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Ethan Park",
    email: "epa137@cornell.edu",
  },
};

const order = (
  overrides: Partial<ReferralStatsOrder> = {},
): ReferralStatsOrder => ({
  referral: null,
  paymentStatus: "CONFIRMED",
  pickedUp: false,
  items: [{ quantity: 2, item: { price: "3.50" } }],
  ...overrides,
});

const statsFor = (
  referralId: string,
  orders: ReferralStatsOrder[],
) =>
  computeReferralStats([maya, ethan], orders).find((r) => r.id === referralId)!;

describe("computeReferralStats", () => {
  it("goes up by one when an admin attaches a referrer to a paid order that had none", () => {
    const before = [order({ referral: { id: maya.id } }), order()];
    const after = [order({ referral: { id: maya.id } }), order({ referral: { id: maya.id } })];

    expect(statsFor(maya.id, before)).toMatchObject({
      orderCount: 1,
      amountRaised: 7,
      attributedOrderCount: 1,
    });
    expect(statsFor(maya.id, after)).toMatchObject({
      orderCount: 2,
      amountRaised: 14,
      attributedOrderCount: 2,
    });
  });

  it("moves the credit when the referrer is changed", () => {
    const before = [order({ referral: { id: ethan.id } })];
    const after = [order({ referral: { id: maya.id } })];

    expect(statsFor(ethan.id, before).orderCount).toBe(1);
    expect(statsFor(maya.id, before).orderCount).toBe(0);
    expect(statsFor(ethan.id, after).orderCount).toBe(0);
    expect(statsFor(maya.id, after).orderCount).toBe(1);
  });

  it("drops the credit when the referrer is cleared", () => {
    expect(statsFor(maya.id, [order({ referral: { id: maya.id } })]).orderCount).toBe(1);
    expect(statsFor(maya.id, [order({ referral: null })]).orderCount).toBe(0);
  });

  it("only counts paid or picked-up orders, but attributes unpaid ones", () => {
    const stats = statsFor(maya.id, [
      order({ referral: { id: maya.id }, paymentStatus: "PENDING" }),
      order({ referral: { id: maya.id }, paymentStatus: "UNVERIFIABLE", pickedUp: true }),
    ]);

    expect(stats).toMatchObject({
      orderCount: 1,
      amountRaised: 7,
      attributedOrderCount: 2,
    });
  });
});
