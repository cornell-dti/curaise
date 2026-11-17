"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CompleteItemSchema, CompleteOrderSchema } from "common";
import { z } from "zod";

type Item = z.infer<typeof CompleteItemSchema>;
type Order = z.infer<typeof CompleteOrderSchema>;

interface ItemsSoldCardProps {
	items: Item[];
	orders: Order[];
}

type ItemRow = {
	id: string;
	name: string;
	limit: number | null;
	unitsSold: number;
	available: number | null;
};

const isConfirmedOrPickedUp = (order: Order) =>
	order.paymentStatus === "CONFIRMED" || order.pickedUp;

export function ItemsSoldCard({
	items,
	orders,
}: ItemsSoldCardProps) {
	const rankedItems = useMemo(() => {
		const rows = new Map<string, ItemRow>();

		items.forEach((item) => {
			rows.set(item.id, {
				id: item.id,
				name: item.name,
				limit: item.limit ?? null,
				unitsSold: 0,
				available: item.limit ?? null,
			});
		});

		orders.forEach((order) => {
			if (!isConfirmedOrPickedUp(order)) {
				return;
			}

			order.items.forEach((orderItem) => {
				const row = rows.get(orderItem.item.id) ?? {
					id: orderItem.item.id,
					name: orderItem.item.name,
					limit: orderItem.item.limit ?? null,
					unitsSold: 0,
					available: orderItem.item.limit ?? null,
				};

				row.unitsSold += orderItem.quantity;
				row.available =
					row.limit !== null ? Math.max(0, row.limit - row.unitsSold) : null;
				rows.set(orderItem.item.id, row);
			});
		});

		return Array.from(rows.values()).sort((a, b) => {
			if (b.unitsSold !== a.unitsSold) {
				return b.unitsSold - a.unitsSold;
			}
			return a.name.localeCompare(b.name);
		});
	}, [items, orders]);

	const totalRealUnits = useMemo(
		() =>
			rankedItems.reduce((sum, item) => sum + item.unitsSold, 0),
		[rankedItems]
	);

	return (
		<div
			className="max-h-[222px] space-y-4 overflow-y-auto pr-2"
		>
				{rankedItems.map((item) => {
					const limit = item.limit;
					const progressValue =
						limit !== null && limit > 0
							? (item.unitsSold / limit) * 100
							: totalRealUnits > 0
								? (item.unitsSold / totalRealUnits) * 100
								: 0;
					const remainingPercent =
						limit !== null && item.available !== null && limit > 0
							? (item.available / limit) * 100
							: null;
					const isOutOfStock =
						limit !== null && item.available !== null && item.available <= 0;
					const isLowStock =
						limit !== null &&
						item.available !== null &&
						item.available > 0 &&
						remainingPercent !== null &&
						remainingPercent <= 10;

					return (
						<div key={item.id} className="flex items-start gap-3">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
								<span className="text-sm font-medium text-muted-foreground">
									{item.name.charAt(0)}
								</span>
							</div>

							<div className="min-w-0 flex-1 space-y-1.5">
								<div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
									<span
										className="line-clamp-2 min-w-[7rem] flex-1 break-words text-sm font-medium text-foreground"
										title={item.name}
									>
										{item.name}
									</span>
									<span
										className={cn(
											"shrink-0 whitespace-nowrap text-sm font-semibold",
											isOutOfStock && "text-red-700",
											isLowStock && "text-yellow-700"
										)}
										title={
											isOutOfStock
												? "Out of stock"
												: isLowStock
													? "Low stock"
													: undefined
										}
									>
										{limit !== null
											? `${item.unitsSold} / ${limit} sold`
											: `${item.unitsSold} sold`}
									</span>
								</div>

								<Progress
									value={Math.min(progressValue, 100)}
									className="h-2 [&>div]:bg-green-700"
								/>
							</div>
						</div>
					);
				})}
		</div>
	);
}
