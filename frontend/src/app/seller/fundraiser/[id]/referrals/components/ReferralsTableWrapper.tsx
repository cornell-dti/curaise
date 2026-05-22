"use client";

import { ReferralsTable } from "./ReferralsTable";
import {
	getReferralsColumns,
	ReferralWithQuantities,
} from "./ReferralsTableColumns";
import { ReferralSchema } from "common/schemas/fundraiser";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";

type Referral = z.infer<typeof ReferralSchema>;
type Order = z.infer<typeof CompleteOrderSchema>;

interface ReferralsTableWrapperProps {
	referrals: Referral[];
	orders: Order[];
}

export function ReferralsTableWrapper({
	referrals,
	orders,
}: ReferralsTableWrapperProps) {
	// Calculate order count and amount raised for each referral
	const referralsWithQuantities: ReferralWithQuantities[] = referrals.map(
		(referral) => {
			// Only count orders that are confirmed (paid or picked up)
			const referralOrders = orders.filter(
				(order) =>
					order.referral?.id === referral.id &&
					(order.paymentStatus === "CONFIRMED" || order.pickedUp),
			);

			const orderCount = referralOrders.length;
			const amountRaised = referralOrders.reduce(
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
				orderCount,
				amountRaised,
			};
		},
	);

	const columns = getReferralsColumns();

	return <ReferralsTable columns={columns} data={referralsWithQuantities} />;
}
