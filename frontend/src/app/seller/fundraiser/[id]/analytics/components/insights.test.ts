import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
	ItemStat,
	formatCount,
	formatMoney,
	formatShortAmount,
	getItemStats,
	getShownUnits,
	getStockAlert,
	getUnitsOverLimit,
	isPendingOrder,
} from "./insights";

const item = (id: string, price: string, limit: number | null = null) => ({
	id,
	name: `Item ${id}`,
	price: new Decimal(price),
	limit,
});

const stat = (overrides: Partial<ItemStat>): ItemStat => ({
	id: "a",
	name: "Item a",
	price: 1,
	limit: null,
	confirmed: 0,
	pending: 0,
	...overrides,
});

const brownie = item("brownie", "3.50", 20);
const cookie = item("cookie", "2.00");

describe("isPendingOrder", () => {
	it("does not treat confirmed or picked-up orders as pending", () => {
		expect(isPendingOrder({ paymentStatus: "CONFIRMED", pickedUp: false })).toBe(
			false
		);
		expect(
			isPendingOrder({ paymentStatus: "UNVERIFIABLE", pickedUp: true })
		).toBe(false);
		expect(isPendingOrder({ paymentStatus: "PENDING", pickedUp: true })).toBe(
			false
		);
	});

	it("treats every other order as pending", () => {
		expect(isPendingOrder({ paymentStatus: "PENDING", pickedUp: false })).toBe(
			true
		);
		expect(
			isPendingOrder({ paymentStatus: "UNVERIFIABLE", pickedUp: false })
		).toBe(true);
	});
});

describe("getItemStats", () => {
	it("splits units into confirmed and pending per item", () => {
		const stats = getItemStats(
			[brownie, cookie],
			[
				{
					paymentStatus: "CONFIRMED",
					pickedUp: false,
					items: [
						{ quantity: 2, item: brownie },
						{ quantity: 1, item: cookie },
					],
				},
				{
					paymentStatus: "UNVERIFIABLE",
					pickedUp: true,
					items: [{ quantity: 3, item: brownie }],
				},
				{
					paymentStatus: "PENDING",
					pickedUp: false,
					items: [{ quantity: 4, item: brownie }],
				},
			]
		);

		expect(stats).toEqual([
			{
				id: "brownie",
				name: "Item brownie",
				price: 3.5,
				limit: 20,
				confirmed: 5,
				pending: 4,
			},
			{
				id: "cookie",
				name: "Item cookie",
				price: 2,
				limit: null,
				confirmed: 1,
				pending: 0,
			},
		]);
	});

	it("keeps items with no orders and items missing from the item list", () => {
		const removed = item("removed", "9.99");
		const stats = getItemStats(
			[brownie],
			[
				{
					paymentStatus: "PENDING",
					pickedUp: false,
					items: [{ quantity: 1, item: removed }],
				},
			]
		);

		expect(stats.map(({ id, confirmed, pending }) => [id, confirmed, pending])).toEqual([
			["brownie", 0, 0],
			["removed", 0, 1],
		]);
	});

	it("sorts by confirmed units, then by name", () => {
		const a = item("a", "1.00");
		const b = item("b", "1.00");
		const c = item("c", "1.00");
		const confirmedOrder = (quantity: number, of: typeof a) => ({
			paymentStatus: "CONFIRMED" as const,
			pickedUp: false,
			items: [{ quantity, item: of }],
		});

		const stats = getItemStats(
			[c, b, a],
			[confirmedOrder(1, c), confirmedOrder(5, a), confirmedOrder(1, b)]
		);

		expect(stats.map(({ id }) => id)).toEqual(["a", "b", "c"]);
	});

	it("returns nothing for a fundraiser with no items and no orders", () => {
		expect(getItemStats([], [])).toEqual([]);
	});

	it("adds up very large quantities", () => {
		const sticker = item("sticker", "0.50", 5000);
		const [stats] = getItemStats(
			[sticker],
			[
				{
					paymentStatus: "CONFIRMED",
					pickedUp: false,
					items: [{ quantity: 4999, item: sticker }],
				},
				{
					paymentStatus: "PENDING",
					pickedUp: false,
					items: [{ quantity: 3, item: sticker }],
				},
			]
		);

		expect(stats).toMatchObject({ confirmed: 4999, pending: 3, price: 0.5 });
	});
});

describe("getShownUnits", () => {
	it("adds pending units only when they are included", () => {
		const tiramisu = stat({ confirmed: 6, pending: 2 });
		expect(getShownUnits(tiramisu, true)).toBe(8);
		expect(getShownUnits(tiramisu, false)).toBe(6);
	});
});

describe("getUnitsOverLimit", () => {
	it("is zero without a limit", () => {
		expect(getUnitsOverLimit(stat({ confirmed: 500, pending: 500 }), true)).toBe(0);
	});

	it("counts pending units past the limit only when they are included", () => {
		const tiramisu = stat({ limit: 7, confirmed: 6, pending: 2 });
		expect(getUnitsOverLimit(tiramisu, true)).toBe(1);
		expect(getUnitsOverLimit(tiramisu, false)).toBe(0);
	});

	it("counts confirmed units past the limit", () => {
		const poster = stat({ limit: 10, confirmed: 12 });
		expect(getUnitsOverLimit(poster, false)).toBe(2);
	});

	it("is zero exactly at the limit", () => {
		expect(getUnitsOverLimit(stat({ limit: 12, confirmed: 11, pending: 1 }), true)).toBe(
			0
		);
	});
});

describe("getStockAlert", () => {
	it("has no alert without a limit", () => {
		expect(getStockAlert(stat({ confirmed: 9999, pending: 9999 }), true)).toBeNull();
	});

	it("is out of stock once confirmed units reach or pass the limit", () => {
		expect(getStockAlert(stat({ limit: 1, confirmed: 1 }), false)).toBe("out");
		expect(getStockAlert(stat({ limit: 10, confirmed: 12 }), false)).toBe("out");
	});

	const alertAt = (limit: number, confirmed: number) =>
		getStockAlert(stat({ limit, confirmed }), false);

	it("is low on stock when a tenth of the limit or less is left", () => {
		expect(alertAt(10, 9)).toBe("low");
		expect(alertAt(10, 8)).toBeNull();
		expect(alertAt(100, 90)).toBe("low");
		expect(alertAt(100, 89)).toBeNull();
		expect(alertAt(5000, 4500)).toBe("low");
		expect(alertAt(5000, 4499)).toBeNull();
	});

	it("rounds a tenth of the limit up to a whole unit", () => {
		expect(alertAt(7, 6)).toBe("low");
		expect(alertAt(7, 5)).toBeNull();
		expect(alertAt(12, 10)).toBe("low");
		expect(alertAt(12, 9)).toBeNull();
		expect(alertAt(25, 22)).toBe("low");
		expect(alertAt(25, 21)).toBeNull();
	});

	it("has no alert before anything is taken", () => {
		expect(alertAt(1, 0)).toBeNull();
		expect(alertAt(2, 0)).toBeNull();
		expect(alertAt(2, 1)).toBe("low");
		expect(alertAt(20, 0)).toBeNull();
	});

	it("counts pending units only when they are included", () => {
		const tiramisu = stat({ limit: 7, confirmed: 6, pending: 2 });
		expect(getStockAlert(tiramisu, true)).toBe("out");
		expect(getStockAlert(tiramisu, false)).toBe("low");

		const brownie = stat({ limit: 20, confirmed: 16, pending: 2 });
		expect(getStockAlert(brownie, true)).toBe("low");
		expect(getStockAlert(brownie, false)).toBeNull();

		const allPending = stat({ limit: 7, confirmed: 0, pending: 50 });
		expect(getStockAlert(allPending, true)).toBe("out");
		expect(getStockAlert(allPending, false)).toBeNull();
	});
});

describe("formatMoney", () => {
	it("always shows cents and groups thousands", () => {
		expect(formatMoney(0)).toBe("$0.00");
		expect(formatMoney(0.01)).toBe("$0.01");
		expect(formatMoney(36.7)).toBe("$36.70");
		expect(formatMoney(320411.94)).toBe("$320,411.94");
		expect(formatMoney(1234567.5)).toBe("$1,234,567.50");
	});

	it("rounds floating point noise to the cent", () => {
		expect(formatMoney(0.1 + 0.2)).toBe("$0.30");
		expect(formatMoney(26.8 + 7.2)).toBe("$34.00");
	});
});

describe("formatShortAmount", () => {
	it("drops the cents from whole amounts", () => {
		expect(formatShortAmount(0)).toBe("0");
		expect(formatShortAmount(42)).toBe("42");
		expect(formatShortAmount(100000)).toBe("100,000");
	});

	it("keeps both cents digits otherwise", () => {
		expect(formatShortAmount(45.5)).toBe("45.50");
		expect(formatShortAmount(0.01)).toBe("0.01");
		expect(formatShortAmount(237490.5)).toBe("237,490.50");
	});

	it("rounds floating point noise to the cent", () => {
		expect(formatShortAmount(0.1 + 0.2)).toBe("0.30");
		expect(formatShortAmount(41.999999999)).toBe("42");
		expect(formatShortAmount(3 * 2.1)).toBe("6.30");
	});
});

describe("formatCount", () => {
	it("groups thousands", () => {
		expect(formatCount(0)).toBe("0");
		expect(formatCount(999)).toBe("999");
		expect(formatCount(1648)).toBe("1,648");
	});
});
