import type { ReferralSchema } from "common";
import type { z } from "zod";

type Referral = z.infer<typeof ReferralSchema>;

// The subset of an order needed to credit it to a referrer
export interface ReferralStatsOrder {
  referral?: { id: string } | null;
  paymentStatus: string;
  pickedUp: boolean;
  // Parsed orders carry Decimal prices; Number() reads them via valueOf
  items: {
    quantity: number;
    item: { price: string | number | { valueOf(): string | number } };
  }[];
}

export interface ReferralWithStats extends Referral {
  // Credited orders that are paid or picked up
  orderCount: number;
  amountRaised: number;
  // Every order credited to this referrer, including unpaid ones
  attributedOrderCount: number;
}

// Counts are derived from each order's current referral, so changing an
// order's referrer (at checkout or later by an admin) moves its credit.
export function computeReferralStats(
  referrals: Referral[],
  orders: ReferralStatsOrder[],
): ReferralWithStats[] {
  return referrals.map((referral) => {
    const attributedOrders = orders.filter(
      (order) => order.referral?.id === referral.id,
    );
    const countedOrders = attributedOrders.filter(
      (order) => order.paymentStatus === "CONFIRMED" || order.pickedUp,
    );

    const amountRaised = countedOrders.reduce(
      (total, order) =>
        total +
        order.items.reduce(
          (sum, item) => sum + Number(item.item.price) * item.quantity,
          0,
        ),
      0,
    );

    return {
      ...referral,
      orderCount: countedOrders.length,
      amountRaised,
      attributedOrderCount: attributedOrders.length,
    };
  });
}
