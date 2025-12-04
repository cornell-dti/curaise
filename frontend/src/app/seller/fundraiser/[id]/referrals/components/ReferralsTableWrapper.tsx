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
	// Calculate order count for each referral
	const referralsWithQuantities: ReferralWithQuantities[] = referrals.map(
		(referral) => {
			// Count how many orders have this referral ID
			const orderCount = orders.filter(
				(order) => order.referral?.id === referral.id
			).length;

			return {
				...referral,
				orderCount,
			};
		}
	);

	const columns = getReferralsColumns();

	return <ReferralsTable columns={columns} data={referralsWithQuantities} />;
}
