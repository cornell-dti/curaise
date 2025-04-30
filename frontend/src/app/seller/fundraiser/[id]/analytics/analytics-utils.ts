import { StringPriceOrder } from "./analytics";

/**
 * Format a date as relative time (e.g., "3 hours ago", "Yesterday")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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
    return `Yesterday at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Less than a week ago
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // More than a week ago - show the actual date
  return date.toLocaleDateString();
};

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
    const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
    revenueByDay.set(dateString, 0);
  }

  // Process each order
  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    // Skip orders outside our time window
    if (orderDate < startDate || orderDate > today) return;

    const dateString = orderDate.toISOString().split("T")[0]; // YYYY-MM-DD

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
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

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
export const getYAxisDomain = (data: any[]) => {
  if (data.length === 0) return [0, 10];

  const maxRevenue = Math.max(...data.map((item) => item.cumulativeRevenue));
  // Round up to nearest 50 or 100 for a cleaner chart
  if (maxRevenue < 100) {
    return [0, Math.ceil(maxRevenue / 10) * 10];
  } else if (maxRevenue < 1000) {
    return [0, Math.ceil(maxRevenue / 50) * 50];
  } else {
    return [0, Math.ceil(maxRevenue / 100) * 100];
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

/**
 * Calculate goal progress percentage
 */
export const calculateGoalProgress = (
  currentAmount: number,
  goalAmount: number
): number => {
  return Math.min((currentAmount / goalAmount) * 100, 100);
};
