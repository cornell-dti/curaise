import { CompleteItemSchema, CompleteOrderSchema } from "common";
import { z } from "zod";

type Item = Pick<
	z.infer<typeof CompleteItemSchema>,
	"id" | "name" | "price" | "limit"
>;
type Order = Pick<
	z.infer<typeof CompleteOrderSchema>,
	"paymentStatus" | "pickedUp"
> & { items: { quantity: number; item: Item }[] };

export type ItemStat = {
	id: string;
	name: string;
	price: number;
	limit: number | null;
	confirmed: number;
	pending: number;
};

export const isPendingOrder = (
	order: Pick<Order, "paymentStatus" | "pickedUp">
) => order.paymentStatus !== "CONFIRMED" && !order.pickedUp;

export function getItemStats(items: Item[], orders: Order[]): ItemStat[] {
	const stats = new Map<string, ItemStat>();
	const statFor = (item: Item) => {
		const existing = stats.get(item.id);
		if (existing) {
			return existing;
		}
		const created: ItemStat = {
			id: item.id,
			name: item.name,
			price: Number(item.price),
			limit: item.limit ?? null,
			confirmed: 0,
			pending: 0,
		};
		stats.set(item.id, created);
		return created;
	};

	items.forEach(statFor);
	orders.forEach((order) => {
		const isPending = isPendingOrder(order);
		order.items.forEach(({ item, quantity }) => {
			const stat = statFor(item);
			if (isPending) {
				stat.pending += quantity;
			} else {
				stat.confirmed += quantity;
			}
		});
	});

	return Array.from(stats.values()).sort(
		(a, b) => b.confirmed - a.confirmed || a.name.localeCompare(b.name)
	);
}

export const getShownUnits = (stat: ItemStat, includePending: boolean) =>
	includePending ? stat.confirmed + stat.pending : stat.confirmed;

export const getUnitsOverLimit = (stat: ItemStat, includePending: boolean) =>
	stat.limit === null
		? 0
		: Math.max(0, getShownUnits(stat, includePending) - stat.limit);

const LOW_STOCK_PERCENT = 10;

export const getStockAlert = (
	stat: ItemStat,
	includePending: boolean
): "out" | "low" | null => {
	if (stat.limit === null) {
		return null;
	}
	const taken = getShownUnits(stat, includePending);
	const available = Math.max(0, stat.limit - taken);
	if (available === 0) {
		return "out";
	}
	const lowAt = Math.ceil((stat.limit * LOW_STOCK_PERCENT) / 100);
	return taken > 0 && available <= lowAt ? "low" : null;
};

const moneyFormat = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export const formatMoney = (amount: number) => moneyFormat.format(amount);

export const formatShortAmount = (amount: number) => {
	const cents = Math.round(amount * 100);
	return (cents / 100).toLocaleString("en-US", {
		minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	});
};

export const formatCount = (count: number) => count.toLocaleString("en-US");
