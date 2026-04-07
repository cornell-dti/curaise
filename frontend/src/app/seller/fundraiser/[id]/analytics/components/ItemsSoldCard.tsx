"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
						totalRealUnits > 0 ? (item.unitsSold / totalRealUnits) * 100 : 0;
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

							<div className="flex-1 space-y-1.5">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-medium text-foreground">
												{item.name}
											</span>
											{limit !== null && isOutOfStock ? (
												<Badge className="bg-red-100 text-red-700 hover:bg-red-100">
													Out of Stock
												</Badge>
											) : limit !== null && isLowStock ? (
												<Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
													Low Stock
												</Badge>
											) : null}
										</div>
									</div>

									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold whitespace-nowrap">
											{limit !== null
												? `${item.unitsSold} / ${limit} sold`
												: `${item.unitsSold} sold`}
										</span>
									</div>
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
