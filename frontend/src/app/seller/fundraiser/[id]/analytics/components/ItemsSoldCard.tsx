"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ItemsSoldCardProps {
	items: Record<string, number>;
}

export function ItemsSoldCard({ items }: ItemsSoldCardProps) {
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
			<div className="space-y-6">
				{currentItems.map((item, index) => {
					const percentage = total > 0 ? (item.quantity / total) * 100 : 0;
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
									<span className="text-base font-semibold">
										{item.quantity}/{total}
									</span>
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
						<ChevronLeft className="h-4 w-4" />
						Prev
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={goToNextPage}
						disabled={currentPage === totalPages}>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
