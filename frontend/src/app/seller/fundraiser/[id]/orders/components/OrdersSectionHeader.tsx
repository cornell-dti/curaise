"use client";

import { ManualOrderModal } from "./ManualOrderModal";
import { CompleteItemSchema } from "common";
import { z } from "zod";
import { useRouter } from "next/navigation";

type Item = z.infer<typeof CompleteItemSchema>;

interface OrdersSectionHeaderProps {
	fundraiserId: string;
	items: Item[];
	token: string;
}

export function OrdersSectionHeader({
	fundraiserId,
	items,
	token,
}: OrdersSectionHeaderProps) {
	const router = useRouter();

	// When new order is created, resfresh as the orders list will be updated
	const handleOrderCreated = () => {
		router.refresh();
	};

	return (
		<div className="flex items-center justify-between mb-6">
			<h2 className="text-xl font-bold">Orders</h2>
			<ManualOrderModal
				fundraiserId={fundraiserId}
				items={items}
				token={token}
				onOrderCreated={handleOrderCreated}
			/>
		</div>
	);
}
