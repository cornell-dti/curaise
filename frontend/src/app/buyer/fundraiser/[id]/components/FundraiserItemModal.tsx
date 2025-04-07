"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { CompleteItemSchema } from "common";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FundraiserItemModalProps {
	item: z.infer<typeof CompleteItemSchema>;
}

export function FundraiserItemModal({ item }: FundraiserItemModalProps) {
	const [quantity, setQuantity] = useState(1);
	const [isOpen, setIsOpen] = useState(false);

	const incrementQuantity = () => {
		setQuantity((prev) => prev + 1);
	};

	const decrementQuantity = () => {
		if (quantity > 1) {
			setQuantity((prev) => prev - 1);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className="cursor-pointer">
					<FundraiserItemCard item={item} />
				</div>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					{item.imageUrl && (
						<img
							src={item.imageUrl || "/placeholder.svg"}
							alt={item.name}
							className="w-full h-64 object-cover rounded-md mt-5 mb-5"
						/>
					)}
					<DialogTitle>{item.name}</DialogTitle>
					<DialogDescription>{item.description}</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<div className="flex items-center justify-center gap-4">
						<Button
							variant="outline"
							size="icon"
							onClick={decrementQuantity}
							disabled={quantity <= 1}>
							<Minus className="h-4 w-4" />
						</Button>
						<span className="text-lg font-medium w-8 text-center">
							{quantity}
						</span>
						<Button variant="outline" size="icon" onClick={incrementQuantity}>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<DialogFooter>
					<Button className="w-full">
						Add {quantity} {quantity === 1 ? "item" : "items"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
