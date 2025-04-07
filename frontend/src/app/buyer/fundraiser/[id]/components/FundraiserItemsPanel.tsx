'use client';
import { CompleteItemSchema } from 'common';
import { z } from 'zod';
import { FundraiserItemModal } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemModal";

interface FundraiserItemsPanelProps {
	items: z.infer<typeof CompleteItemSchema>[];
};

export function FundraiserItemsPanel({ items }: FundraiserItemsPanelProps) {
    return (
			<div className="bg-white p-10 rounded-md">
				<h2 className="text-2xl font-bold mb-4">Items</h2>

				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
					{items.length === 0 ? (
						<p className="text-gray-500 col-span-2 text-center py-8">
							No items available for this fundraiser.
						</p>
					) : (
						items.map((item) => (
							<FundraiserItemModal key={item.id} item={item} />
						))
					)}
				</div>
			</div>
		);
}