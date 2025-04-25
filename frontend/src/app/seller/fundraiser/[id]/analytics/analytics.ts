import Decimal from "decimal.js";

type OrderItem = {
  item: {
    id: string;
    name: string;
    price: string | number;
  };
  quantity: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  pickedUp?: boolean;
  // other order properties
};

type ProcessedItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
};

export type AnalyticsResult = {
  totalRevenue: string;
  totalItemsSold: number;
  uniqueItemCount: number;
  processedItems: ProcessedItem[];
  totalOrdersPickedUp: number;
  latestOrder: Order | null;
  latestOrderCost: string;
};

/**
 * Processes order data to calculate revenue and item statistics
 */
export function processOrderAnalytics(orders: Order[]): AnalyticsResult {
  let processedItems: ProcessedItem[] = [];
  let revenue = new Decimal(0);
  let totalItemsSold = 0;
  let totalOrdersPickedUp = 0;
  let latestOrder: Order | null = null;
  let latestOrderCost = "0.00";

  // Calculate picked up orders
  totalOrdersPickedUp = orders.filter((order) => order.pickedUp).length;

  // Find the latest order
  if (orders.length > 0) {
    latestOrder = orders[orders.length - 1];
    // Calculate cost of latest order
    if (latestOrder.items && latestOrder.items.length > 0) {
      latestOrderCost = latestOrder.items
        .reduce(
          (total, item) =>
            total.plus(new Decimal(item.item.price).times(item.quantity)),
          new Decimal(0)
        )
        .toFixed(2);
    }
  }

  orders.forEach((order) => {
    order.items.forEach((orderItem) => {
      const item = orderItem.item;
      const quantity = orderItem.quantity;
      const itemPrice = new Decimal(item.price);
      const itemTotal = itemPrice.times(quantity);

      processedItems.push({
        id: item.id,
        name: item.name,
        price: itemPrice.toFixed(2),
        quantity: quantity,
        total: itemTotal.toFixed(2),
      });

      revenue = revenue.plus(itemTotal);
      totalItemsSold += quantity;
    });
  });

  return {
    totalRevenue: revenue.toFixed(2),
    totalItemsSold,
    uniqueItemCount: processedItems.length,
    processedItems,
    totalOrdersPickedUp,
    latestOrder,
    latestOrderCost,
  };
}
