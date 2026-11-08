import { format } from "date-fns";
import type { CompleteOrderSchema } from "common/schemas/order";
import type { z } from "zod";
import { getOrderBuyer } from "@/lib/order-buyer";

type Order = z.infer<typeof CompleteOrderSchema>;

export const ORDER_CREATED_AT_FORMAT = "MMM d, yyyy h:mm a";

export function formatOrderCreatedAt(value: Date | string) {
	return format(new Date(value), ORDER_CREATED_AT_FORMAT);
}

const paymentStatusLabel = (status: string | undefined) => {
	if (status === "CONFIRMED") return "Received";
	if (status === "UNVERIFIABLE") return "Unverified";
	if (status === "PENDING") return "Not Received";
	return "Unknown";
};

function escapeCsvCell(value: string) {
	return `"${value.replace(/"/g, '""')}"`;
}

export function buildOrdersCsv(orders: Order[]) {
	const headers = [
		"Name",
		"Email",
		"NetID",
		"Created At",
		"Order Details",
		"Payment Method",
		"Payment Status",
		"Pickup Status",
		"Order Total",
	];

	const rows = orders.map((order) => {
		const orderTotal = order.items.reduce(
			(total, item) => total + item.quantity * Number(item.item.price),
			0,
		);

		const orderDetails = order.items
			.map((item) => `${item.quantity} ${item.item.name}`)
			.join(", ");

		const buyer = getOrderBuyer(order);

		return [
			buyer.name || "Unknown",
			buyer.email || "Unknown",
			buyer.netId || "Unknown",
			formatOrderCreatedAt(order.createdAt),
			orderDetails,
			order.paymentMethod || "Unknown",
			paymentStatusLabel(order.paymentStatus),
			order.pickedUp ? "Picked Up" : "Not Picked Up",
			`$${orderTotal.toFixed(2)}`,
		];
	});

	return [
		headers.join(","),
		...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
	].join("\n");
}
