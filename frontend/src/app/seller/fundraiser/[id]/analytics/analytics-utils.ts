import Decimal from "decimal.js";
import { z } from "zod";
import { CompleteOrderSchema } from "common";
import { StringPriceOrder } from "./analytics";

type Order = z.infer<typeof CompleteOrderSchema>;

/*****************************************
 * DATE UTILITIES
 *****************************************/

/**
 * Format a date as relative time (e.g., "3 hours ago", "Yesterday")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Less than 24 hours ago
  if (diffHours < 24) {
    return diffHours === 0
      ? "Just now"
      : diffHours === 1
      ? "1 hour ago"
      : `${diffHours} hours ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return `Yesterday at ${dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Less than a week ago
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // More than a week ago - show the actual date
  return dateObj.toLocaleDateString();
};

/**
 * Format a date to YYYY-MM-DD string
 */
export const formatDateToYMD = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Format a date for display (e.g., "Jan 15")
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

/**
 * Generate an array of dates between start and end (inclusive)
 */
export const generateDateRange = (
  startDate: Date,
  endDate: Date
): { dateStr: string; displayDate: string }[] => {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDateToYMD(currentDate);
    dates.push({
      dateStr,
      displayDate: formatDateForDisplay(currentDate),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/*****************************************
 * FINANCIAL UTILITIES
 *****************************************/

/**
 * Calculate total for a single order
 */
export const calculateOrderTotal = (order: Order): Decimal => {
  return order.items.reduce(
    (sum, item) =>
      sum.plus(new Decimal(item.item.price.toString()).times(item.quantity)),
    new Decimal(0)
  );
};

/**
 * Calculate total for a single order - returns string with 2 decimal places
 */
export const calculateOrderTotalString = (order: Order): string => {
  return calculateOrderTotal(order).toFixed(2);
};

/**
 * Format currency value for display
 */
export const formatCurrency = (value: number | string | Decimal): string => {
  const decimalValue =
    typeof value === "object" ? value : new Decimal(value.toString());

  return decimalValue.toFixed(2);
};

/**
 * Calculate goal progress percentage
 */
export const calculateGoalProgress = (
  currentAmount: number | Decimal,
  goalAmount: number | Decimal
): number => {
  const current =
    typeof currentAmount === "number"
      ? currentAmount
      : currentAmount.toNumber();

  const goal =
    typeof goalAmount === "number" ? goalAmount : goalAmount.toNumber();

  return Math.min((current / goal) * 100, 100);
};

/*****************************************
 * SORTING UTILITIES
 *****************************************/

/**
 * Sort orders by creation date (newest first)
 */
export const sortOrdersByDate = (
  orders: Order[],
  ascending = false
): Order[] => {
  return [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/*****************************************
 * ANALYTICS PROCESSING UTILITIES
 *****************************************/

/**
 * Process revenue data for charting over a specific time window
 */
export const processRevenueOverTime = (
  orders: StringPriceOrder[],
  timeWindow: number = 30
) => {
  // Create a map to store daily revenue
  const revenueByDay = new Map<string, number>();

  // Get date range (today to X days ago)
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - (timeWindow - 1));

  // Initialize all dates in the range with 0 revenue
  for (let i = 0; i < timeWindow; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = formatDateToYMD(date);
    revenueByDay.set(dateString, 0);
  }

  // Process each order
  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    // Skip orders outside our time window
    if (orderDate < startDate || orderDate > today) return;

    const dateString = formatDateToYMD(orderDate);

    // Calculate revenue for this order
    const orderRevenue = order.items.reduce(
      (sum, item) => sum + Number(item.item.price) * item.quantity,
      0
    );

    // Add to existing revenue for this day
    const currentRevenue = revenueByDay.get(dateString) || 0;
    revenueByDay.set(dateString, currentRevenue + orderRevenue);
  });

  // Convert map to array of objects for chart data
  const chartData = Array.from(revenueByDay.entries()).map(
    ([date, revenue]) => {
      // Format date to be more readable
      const formattedDate = formatDateForDisplay(date);

      return {
        date: formattedDate,
        revenue: revenue,
        // Store original date for sorting
        originalDate: date,
      };
    }
  );

  // Sort by date
  chartData.sort((a, b) => a.originalDate.localeCompare(b.originalDate));

  // Calculate cumulative revenue for running total
  let cumulativeRevenue = 0;
  const chartDataWithCumulative = chartData.map((item) => {
    cumulativeRevenue += item.revenue;
    return {
      ...item,
      cumulativeRevenue,
    };
  });

  return chartDataWithCumulative;
};

/**
 * Calculate the reasonable Y-axis range for charts
 */
// todo: @steven delete this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getYAxisDomain = (data: any[], key = "cumulativeRevenue") => {
  if (data.length === 0) return [0, 10];

  const maxValue = Math.max(...data.map((item) => item[key]));
  // Round up to nearest 50 or 100 for a cleaner chart
  if (maxValue < 100) {
    return [0, Math.ceil(maxValue / 10) * 10];
  } else if (maxValue < 1000) {
    return [0, Math.ceil(maxValue / 50) * 50];
  } else {
    return [0, Math.ceil(maxValue / 100) * 100];
  }
};

/**
 * Aggregate item sales data (group by item)
 */
export const processItemSales = (orders: StringPriceOrder[]) => {
  const itemMap = new Map<
    string,
    {
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }
  >();

  orders.forEach((order) => {
    order.items.forEach((orderItem) => {
      const { item, quantity } = orderItem;
      const itemId = item.id;
      const price = Number(item.price);

      if (itemMap.has(itemId)) {
        const existingItem = itemMap.get(itemId)!;
        existingItem.quantity += quantity;
        existingItem.total += price * quantity;
      } else {
        itemMap.set(itemId, {
          id: itemId,
          name: item.name,
          price: price,
          quantity: quantity,
          total: price * quantity,
        });
      }
    });
  });

  return Array.from(itemMap.values());
};
