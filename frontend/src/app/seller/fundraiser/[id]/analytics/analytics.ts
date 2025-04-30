import Decimal from "decimal.js";
import { z } from "zod";
import { CompleteOrderSchema } from "common";

type Order = z.infer<typeof CompleteOrderSchema>;
export type StringPriceOrder = Omit<Order, "items"> & {
  items: Array<{
    quantity: number;
    item: Omit<Order["items"][number]["item"], "price"> & { price: string };
  }>;
};

export type ProcessedItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
};

export type AnalyticsResult = {
  totalRevenue: string;
  totalItemsSold: number;
  uniqueItems: Map<string, ProcessedItem>;
  uniqueItemCount: number;
  itemTotals: {
    [itemId: string]: {
      name: string;
      quantity: number;
      revenue: string;
    };
  };
  totalOrdersPickedUp: number;
  averageOrderValue: string;
  latestOrder: StringPriceOrder | null;
  latestOrderCost: string;
  dailyRevenue: Map<string, string>;
};

/**
 * Order analytics processing with additional metrics
 */
export function processOrderAnalytics(
  orders: StringPriceOrder[]
): AnalyticsResult {
  // Initialize result object
  const result: AnalyticsResult = {
    totalRevenue: "0.00",
    totalItemsSold: 0,
    uniqueItems: new Map<string, ProcessedItem>(),
    uniqueItemCount: 0,
    itemTotals: {},
    totalOrdersPickedUp: 0,
    averageOrderValue: "0.00",
    latestOrder: null,
    latestOrderCost: "0.00",
    dailyRevenue: new Map<string, string>(),
  };

  if (!orders || orders.length === 0) {
    return result;
  }

  // Calculate picked up orders
  result.totalOrdersPickedUp = orders.filter((order) => order.pickedUp).length;

  // Find the latest order by date
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  result.latestOrder = sortedOrders[0] || null;

  // Total revenue calculation
  let totalRevenue = new Decimal(0);
  let totalOrderValueSum = new Decimal(0);

  // Process each order
  orders.forEach((order) => {
    let orderTotal = new Decimal(0);

    // Group revenue by date for time series analysis
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD

    // Process order items
    order.items.forEach((orderItem) => {
      const item = orderItem.item;
      const quantity = orderItem.quantity;
      const itemPrice = new Decimal(item.price);
      const itemTotal = itemPrice.times(quantity);

      // Add to total revenue
      totalRevenue = totalRevenue.plus(itemTotal);
      orderTotal = orderTotal.plus(itemTotal);

      // Add to total items sold
      result.totalItemsSold += quantity;

      // Track unique items
      if (!result.uniqueItems.has(item.id)) {
        result.uniqueItems.set(item.id, {
          id: item.id,
          name: item.name,
          price: itemPrice.toFixed(2),
          quantity: quantity,
          total: itemTotal.toFixed(2),
        });

        // Initialize item totals
        result.itemTotals[item.id] = {
          name: item.name,
          quantity: quantity,
          revenue: itemTotal.toFixed(2),
        };
      } else {
        // Update existing item data
        const existingItem = result.uniqueItems.get(item.id)!;
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = new Decimal(existingItem.total).plus(itemTotal);

        result.uniqueItems.set(item.id, {
          ...existingItem,
          quantity: newQuantity,
          total: newTotal.toFixed(2),
        });

        // Update item totals
        result.itemTotals[item.id].quantity += quantity;
        result.itemTotals[item.id].revenue = new Decimal(
          result.itemTotals[item.id].revenue
        )
          .plus(itemTotal)
          .toFixed(2);
      }
    });

    // Add to daily revenue map
    const existingDailyRevenue = result.dailyRevenue.get(orderDate)
      ? new Decimal(result.dailyRevenue.get(orderDate)!)
      : new Decimal(0);

    result.dailyRevenue.set(
      orderDate,
      existingDailyRevenue.plus(orderTotal).toFixed(2)
    );

    // Add to order value sum for average calculation
    totalOrderValueSum = totalOrderValueSum.plus(orderTotal);
  });

  // Set final values
  result.totalRevenue = totalRevenue.toFixed(2);
  result.uniqueItemCount = result.uniqueItems.size;

  // Calculate average order value
  if (orders.length > 0) {
    result.averageOrderValue = totalOrderValueSum
      .dividedBy(orders.length)
      .toFixed(2);
  }

  // Calculate latest order cost
  if (
    result.latestOrder &&
    result.latestOrder.items &&
    result.latestOrder.items.length > 0
  ) {
    result.latestOrderCost = result.latestOrder.items
      .reduce(
        (total, item) =>
          total.plus(new Decimal(item.item.price).times(item.quantity)),
        new Decimal(0)
      )
      .toFixed(2);
  }

  return result;
}
