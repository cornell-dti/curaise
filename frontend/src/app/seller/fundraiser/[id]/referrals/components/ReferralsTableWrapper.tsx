"use client";

import { useMemo, useState } from "react";
import { ReferralsTable } from "./ReferralsTable";
import {
	getReferralsColumns,
	ReferralWithQuantities,
} from "./ReferralsTableColumns";
import { ReferralsExportButton } from "./ReferralsExportButton";
import { useReferrals } from "./ReferralsProvider";
import { CompleteOrderSchema } from "common/schemas/order";
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

interface ReferralsTableWrapperProps {
	orders: Order[];
	fundraiserName: string;
}

export function ReferralsTableWrapper({
	orders,
	fundraiserName,
}: ReferralsTableWrapperProps) {
	const { referrals, fundraiserId, refetch } = useReferrals();
	const [toRemove, setToRemove] = useState<ReferralWithQuantities | null>(
		null,
	);
	const [isRemoving, setIsRemoving] = useState(false);

	// Calculate order count and amount raised for each referral
	const referralsWithQuantities: ReferralWithQuantities[] = useMemo(
		() =>
			referrals.map((referral) => {
				const attributedOrders = orders.filter(
					(order) => order.referral?.id === referral.id,
				);
				// Only count orders that are confirmed (paid or picked up)
				const referralOrders = attributedOrders.filter(
					(order) => order.paymentStatus === "CONFIRMED" || order.pickedUp,
				);

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
					orderCount: referralOrders.length,
					amountRaised,
					attributedOrderCount: attributedOrders.length,
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
				toolbar={
					<ReferralsExportButton
						referrals={referralsWithQuantities}
						fundraiserName={fundraiserName}
					/>
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
