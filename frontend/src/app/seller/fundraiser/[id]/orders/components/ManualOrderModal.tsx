"use client";

import { useState } from "react";
import { z } from "zod";
import { CompleteItemSchema } from "common";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";

type Item = z.infer<typeof CompleteItemSchema>;

interface ManualOrderModalProps {
	fundraiserId: string;
	items: Item[];
	token: string;
	onOrderCreated: () => void;
}

interface ItemQuantity {
	[itemId: string]: number;
}

export function ManualOrderModal({
	fundraiserId,
	items,
	token,
	onOrderCreated,
}: ManualOrderModalProps) {
	const [open, setOpen] = useState(false);
	const [quantities, setQuantities] = useState<ItemQuantity>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Updates the quantity for a specific item
	// delta is how many quantities are beign changes (e.g +1, -1)
	const handleQuantityChange = (itemId: string, delta: number) => {
		setQuantities((prev) => {
			const currentQty = prev[itemId] || 0;

			// Calculates new quantity, max to ensure nonnegative
			const newQty = Math.max(0, currentQty + delta);

			if (newQty === 0) {
				// This is a destructing syntax that discards the item
				// Remains the rest of the items with nonzero quantities
				const { [itemId]: _, ...rest } = prev;
				return rest;
			}

			return { ...prev, [itemId]: newQty };
		});
	};

	const calculateTotal = () => {
		return Object.entries(quantities).reduce((total, [itemId, qty]) => {
			const item = items.find((i) => i.id === itemId);
			if (!item) return total;
			return total + Number(item.price) * qty;
		}, 0);
	};

	const handleSaveOrder = async () => {
		// Check that at least one item is selected to place the manual order
		if (Object.keys(quantities).length === 0) {
			toast.error("Please select at least one item");
			return;
		}

		setIsSubmitting(true);

		try {
			const orderItems = Object.entries(quantities).map(
				([itemId, quantity]) => ({
					itemId,
					quantity,
				})
			);

			const response = await fetch(
				process.env.NEXT_PUBLIC_API_URL + "/order/create",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + token,
					},
					body: JSON.stringify({
						fundraiserId,
						items: orderItems,
						payment_method: "OTHER",
					}),
				}
			);

			const result = await response.json();

			if (!response.ok) {
				toast.error(result.message || "Failed to create order");
				return;
			}

			toast.success("Manual order created successfully");
			setOpen(false);
			setQuantities({}); // Refresh all local states of item quantities
			onOrderCreated(); // Will refresh the page
		} catch (error) {
			console.error("Error creating order:", error);
			toast.error("Failed to create order");
		} finally {
			setIsSubmitting(false);
		}
	};

	const total = calculateTotal();
	const hasItems = Object.keys(quantities).length > 0;

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		// Clear quantities when closing the modal
		if (!newOpen) {
			setQuantities({});
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="bg-black hover:bg-gray-800 text-white">
					Add order
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pt-8">
				<DialogHeader className="mb-3">
					<DialogTitle className="text-3xl font-bold">
						Manually add an order
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<div>
						<h3 className="text-2xl font-semibold mb-4">Items</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{items.map((item) => {
								const quantity = quantities[item.id] || 0;

								return (
									<FundraiserItemCard
										key={item.id}
										item={item}
										amount={quantity}
										increment={() => handleQuantityChange(item.id, 1)}
										decrement={() => handleQuantityChange(item.id, -1)}
									/>
								);
							})}
						</div>
					</div>

					<div className="border-t pt-4">
						<div className="flex justify-between items-center text-xl font-bold mb-4">
							<span>Total</span>
							<span>${total.toFixed(2)}</span>
						</div>

						<Button
							onClick={handleSaveOrder}
							disabled={!hasItems || isSubmitting}
							className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base">
							{isSubmitting ? "Saving..." : "Save order"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
