'use client'
import { CompleteItemSchema } from "common";
import Decimal from "decimal.js";
import { Plus } from "lucide-react";
import { z } from "zod";

interface FundraiserItemCardProp {
    item: z.infer<typeof CompleteItemSchema>;
};

const formatPrice = (price: Decimal) => {
    if (price.toFixed) {
        return `$${price.toFixed(2)}`;
    }
    return `$${Number(price).toFixed(2)}`;
};

export function FundraiserItemCard({ item }: FundraiserItemCardProp) {
	return (
		<div className="border rounded-md flex flex-col  overflow-hidden h-full hover:scale-105 transition-transform duration-150">
			<div className="relative w-full h-48 bg-gray-100">
				{item.imageUrl ? (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gray-200">
						<span className="text-gray-400">No image</span>
					</div>
				)}
			</div>

			<div className="flex-1 p-4">
				<h3 className="font-medium text-lg">{item.name}</h3>
				<div className="flex items-center justify-between mt-2">
					<span className="font-medium text-gray-800">
						{formatPrice(item.price)}
					</span>
					<Plus className="w-6 h-6 text-gray-500 hover:text-blue-500 hover:scale-110 transition-transform duration-150" />
				</div>
			</div>
		</div>
	);
}