'use client';
import { CompleteItemSchema } from 'common';
import { z } from 'zod';
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";

type FundraiserItemsPanelsProps = {
	items: z.infer<typeof CompleteItemSchema>[];
};

export function FundraiserItemsPanels({ items }: FundraiserItemsPanelsProps) {
    return (
			<div className="bg-white p-20 rounded-md shadow-md">
				<h2 className="text-2xl font-bold mb-4">Items</h2>

				<div className="flex flex-col flex-wrap justify-between gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
					{items.length === 0 ? (
						<p className="text-gray-500 col-span-2 text-center py-8">
							No items available for this fundraiser.
						</p>
					) : (
						items.map((item) => (
							<FundraiserItemCard key={item.id} item={item} />
						))
					)}
				</div>
			</div>
		);
}