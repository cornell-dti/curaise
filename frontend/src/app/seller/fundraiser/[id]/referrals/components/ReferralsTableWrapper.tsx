"use client";

import { useMemo, useState } from "react";
import { ReferralsTable } from "./ReferralsTable";
import {
	getReferralsColumns,
	ReferralWithQuantities,
} from "./ReferralsTableColumns";
import { ReferralsExportButton } from "./ReferralsExportButton";
import { useReferrals } from "./ReferralsProvider";
import { IncludePendingSwitch } from "../../components/IncludePendingSwitch";
import { useOrders } from "../../orders/components/OrdersProvider";
import {
	CompleteOrderSchema,
	getReferralQuantities,
	isConfirmedOrder,
} from "common/schemas/order";
import { z } from "zod";
import { toast } from "sonner";
import { mutationFetch } from "@/lib/fetcher";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Order = z.infer<typeof CompleteOrderSchema>;

const getOrderTotal = (order: Order) =>
	order.items.reduce(
		(total, { item, quantity }) => total + Number(item.price) * quantity,
		0,
	);

interface ReferralsTableWrapperProps {
	fundraiserName: string;
}

export function ReferralsTableWrapper({
	fundraiserName,
}: ReferralsTableWrapperProps) {
	const { referrals, fundraiserId, refetch } = useReferrals();
	const { orders } = useOrders();
	const [includePending, setIncludePending] = useState(true);
	const [toRemove, setToRemove] = useState<ReferralWithQuantities | null>(
		null,
	);
	const [isRemoving, setIsRemoving] = useState(false);

	const referralsWithQuantities: ReferralWithQuantities[] = useMemo(
		() =>
			referrals.map((referral) => {
				const referralOrders = orders.filter(
					(order) => order.referral?.id === referral.id,
				);
				const quantities = getReferralQuantities(referralOrders);
				const pendingOrders = referralOrders.filter(
					(order) => !isConfirmedOrder(order),
				);
				const pendingAmount = pendingOrders.reduce(
					(total, order) => total + getOrderTotal(order),
					0,
				);
				return {
					...referral,
					...quantities,
					pendingOrderCount: pendingOrders.length,
					pendingAmount,
					totalAmount: quantities.amountRaised + pendingAmount,
				};
			}),
		[referrals, orders],
	);

	const columns = useMemo(
		() => getReferralsColumns({ onRemove: setToRemove }),
		[],
	);

	const handleRemove = async () => {
		if (!toRemove || isRemoving) return;
		setIsRemoving(true);
		try {
			await mutationFetch(
				`/fundraiser/${fundraiserId}/referrals/${toRemove.id}/delete`,
				{ method: "DELETE" },
			);
			await refetch();
			toast.success(`${toRemove.referrer.name} removed as a referrer`);
			setToRemove(null);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to remove referrer",
			);
		} finally {
			setIsRemoving(false);
		}
	};

	const orderCount = toRemove?.attributedOrderCount ?? 0;

	return (
		<>
			<ReferralsTable
				columns={columns}
				data={referralsWithQuantities}
				includePending={includePending}
				toolbar={
					<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
						<IncludePendingSwitch
							checked={includePending}
							onCheckedChange={setIncludePending}
						/>
						<ReferralsExportButton
							referrals={referralsWithQuantities}
							fundraiserName={fundraiserName}
							includePending={includePending}
						/>
					</div>
				}
			/>

			<AlertDialog
				open={toRemove !== null}
				onOpenChange={(open) => {
					if (!open && !isRemoving) setToRemove(null);
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Remove {toRemove?.referrer.name} as a referrer?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{orderCount > 0
								? `${orderCount} ${orderCount === 1 ? "order" : "orders"} credited to them will lose that referral credit. This can't be undone.`
								: "They have no orders credited to them. They can sign up again later."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isRemoving}
							onClick={(e) => {
								// Keep the dialog open until the request finishes
								e.preventDefault();
								void handleRemove();
							}}
							className="bg-[#f74545] text-white hover:bg-[#dc3a3a]">
							{isRemoving ? "Removing..." : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
