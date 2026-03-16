"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ItemsSoldCardProps {
	items: Record<string, number>;
	itemLimits?: Record<string, number | null>;
}

export function ItemsSoldCard({ items, itemLimits = {} }: ItemsSoldCardProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 3;

	// Convert Record to array and calculate total
	const itemsArray = Object.entries(items).map(([name, quantity]) => ({
		name,
		quantity,
	}));

	const total = itemsArray.reduce((sum, item) => sum + item.quantity, 0);

	// Calculate pagination
	const totalPages = Math.ceil(itemsArray.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = itemsArray.slice(startIndex, endIndex);

	const goToPrevPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1));
	};

	const goToNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	};

	return (
		<div className="space-y-6">
			<div className="space-y-6 min-h-[200px]">
				{currentItems.map((item, index) => {
					const percentage = total > 0 ? (item.quantity / total) * 100 : 0;
					const limit = itemLimits[item.name] ?? null;
					const isOutOfStock = limit !== null && item.quantity >= limit;
					const isLowStock = limit !== null && !isOutOfStock && item.quantity >= limit * 0.8;
					return (
						<div key={index} className="flex items-start gap-4">
							<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
								<span className="text-base font-medium text-muted-foreground">
									{item.name.charAt(0)}
								</span>
							</div>

							<div className="flex-1 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-base font-medium text-foreground">
										{item.name}
									</span>
									<div className="flex items-center gap-2">
										<span className="text-base font-semibold">
											{limit !== null
												? `${item.quantity} / ${limit} sold`
												: `${item.quantity}/${total}`}
										</span>
										{isOutOfStock && (
											<span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
												Out of Stock
											</span>
										)}
										{isLowStock && (
											<span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
												Low Stock
											</span>
										)}
									</div>
								</div>
								<Progress
									value={percentage}
									className="h-2.5 [&>div]:bg-green-700"
								/>
							</div>
						</div>
					);
				})}
			</div>

			{totalPages > 1 && (
				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={goToPrevPage}
						disabled={currentPage === 1}>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={goToNextPage}
						disabled={currentPage === totalPages}>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
