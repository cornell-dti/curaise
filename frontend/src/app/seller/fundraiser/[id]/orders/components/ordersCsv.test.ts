import { describe, expect, it } from "vitest";
import type { CompleteOrderSchema } from "common/schemas/order";
import type { z } from "zod";
import { buildOrdersCsv, formatOrderCreatedAt } from "./ordersCsv";

type Order = z.infer<typeof CompleteOrderSchema>;

const order = {
	createdAt: new Date(2026, 9, 7, 14, 5),
	paymentMethod: "VENMO",
	paymentStatus: "CONFIRMED",
	pickedUp: false,
	buyerName: "Ada Lovelace",
	buyerNetId: "al123",
	buyer: { name: "Admin", email: "admin@cornell.edu" },
	items: [
		{ quantity: 2, item: { name: "Cookie", price: "3.50" } },
		{ quantity: 1, item: { name: "Brownie", price: "4.00" } },
	],
} as unknown as Order;

describe("formatOrderCreatedAt", () => {
	it("formats local time in 12-hour clock", () => {
		expect(formatOrderCreatedAt(new Date(2026, 9, 7, 14, 5))).toBe(
			"Oct 7, 2026 2:05 PM",
		);
		expect(formatOrderCreatedAt(new Date(2026, 9, 7, 9, 5))).toBe(
			"Oct 7, 2026 9:05 AM",
		);
	});
});

describe("buildOrdersCsv", () => {
	it("includes Created At for only the rows it is given", () => {
		const csv = buildOrdersCsv([order]);
		const [header, row] = csv.split("\n");

		expect(header?.split(",")).toEqual([
			"Name",
			"Email",
			"NetID",
			"Created At",
			"Order Details",
			"Payment Method",
			"Payment Status",
			"Pickup Status",
			"Order Total",
		]);
		expect(row).toContain('"Oct 7, 2026 2:05 PM"');
		expect(row).toContain('"Ada Lovelace"');
		expect(row).toContain('"$11.00"');
		expect(csv.split("\n")).toHaveLength(2);
	});
});
