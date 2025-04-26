import { RefreshCw, BarChart2 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { processOrderAnalytics } from "@/app/seller/fundraiser/[id]/analytics/analytics";
import {
  CompleteFundraiserSchema,
  CompleteOrderSchema,
  CompleteOrganizationSchema,
  BasicItemSchema,
} from "common";
import { z } from "zod";
import Decimal from "decimal.js";
import dynamic from "next/dynamic";

// Dynamically import the client component with SSR disabled
const RevenueChart = dynamic(() => import("../components/RevenueChart"));

const getFundraiser = async (id: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + id,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  // parse fundraiser data
  const data = CompleteFundraiserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data");
  }
  return data.data;
};

const getOrganization = async (organization_id: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/organization/" + organization_id,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteOrganizationSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse organization data");
  }
  return data.data;
};

const getFundraiserItems = async (fundraiserId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/items",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch fundraiser items");
  }
  return result.data || [];
};

type Order = z.infer<typeof CompleteOrderSchema>;
type OrderItem = z.infer<typeof CompleteOrderSchema>["items"][number];
type OrderResponse = {
  data?: {
    cleanedOrders?: Order[];
  };
  message?: string;
};

type FundraiserItem = {
  id: string;
  name: string;
  price: string | number;
  description?: string;
  fundraiser_id: string;
  [key: string]: any;
};

const getOrdersByFundraiser = async (
  fundraiserId: string,
  token: string
): Promise<Order[]> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/orders",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const result = (await response.json()) as OrderResponse;

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch orders");
  }
  // Access the cleanedOrders array from the response
  return Array.isArray(result.data?.cleanedOrders)
    ? result.data.cleanedOrders
    : [];
};

const getRecentOrders = async (
  fundraiserId: string,
  token: string,
  limit = 10
): Promise<Order[]> => {
  // Get all orders without query parameters, then sort and limit in JavaScript
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/orders`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = (await response.json()) as OrderResponse;

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch recent orders");
  }

  // Get all orders and sort them by createdAt in descending order
  const allOrders = Array.isArray(result.data?.cleanedOrders)
    ? result.data.cleanedOrders
    : [];

  // Sort by createdAt in descending order (newest first)
  const sortedOrders = [...allOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Return only the first 'limit' orders
  return sortedOrders.slice(0, limit);
};

// Utility function to format date as relative time
const formatRelativeTime = (date: Date): string => {
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

// Data processing function for revenue over time
const processRevenueOverTime = (orders: Order[], timeWindow: number = 30) => {
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

// Function to calculate the reasonable Y-axis range
const getYAxisDomain = (data: any[]) => {
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

// Function to aggregate item sales data (group by item)
const processItemSales = (orders: Order[]) => {
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

export default async function FundraiserAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const id = (await params).id;

  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/login");
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  const fundraiser = await getFundraiser(id, session.access_token);
  const organization = await getOrganization(
    fundraiser.organization.id,
    session.access_token
  );
  const orders = await getOrdersByFundraiser(
    fundraiser.id,
    session.access_token
  );
  const items = await getFundraiserItems(fundraiser.id, session.access_token);
  // Get the 10 most recent orders for the recent orders table
  const recentOrders = await getRecentOrders(
    fundraiser.id,
    session.access_token,
    10
  );
  console.log(`Recent orders count: ${recentOrders.length}`);

  // Process analytics using the existing function
  // Convert any Decimal price values to strings for compatibility
  const processableOrders = orders.map((order) => ({
    ...order,
    items: order.items.map((item: { item: any; quantity: number }) => ({
      ...item,
      item: {
        ...item.item,
        price: item.item.price.toString(),
      },
    })),
  }));

  const analytics = processOrderAnalytics(processableOrders);

  // We'll process revenue data for the chart with 30 days as default
  const revenueData = processRevenueOverTime(processableOrders, 30);

  // Process aggregated item sales
  const aggregatedItemSales = processItemSales(processableOrders);

  // Calculate values needed for the summary cards
  const totalRevenue = analytics.totalRevenue;
  const totalOrdersPickedUp = analytics.totalOrdersPickedUp;
  const totalProfit = Number(totalRevenue) * 0.2; // Assuming 20% profit
  const goalProfit = 150; // Example goal value, could be set dynamically
  const progressPercent = Math.min((totalProfit / goalProfit) * 100, 100);

  return (
    <div className="p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {fundraiser?.name || `Fundraiser ${id}`} Analytics
          </h1>
          {organization && (
            <p className="text-muted-foreground">{organization.name}</p>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center border rounded-lg bg-gray-50">
          <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No Analytics Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Analytics will appear here once your fundraiser has orders.
          </p>
        </div>
      ) : (
        <>
          {/* Key Stats and Goal Progress Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Key Stats Card */}
            <div className="bg-white rounded-lg shadow lg:col-span-3 p-6">
              <h2 className="text-xl font-semibold mb-4">Key Stats</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Revenue Stat */}
                <div className="bg-[#BDCDB3] rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Revenue ($)</div>
                  <div className="text-3xl font-bold">
                    {Number(totalRevenue).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Sold</div>
                </div>

                {/* Total Profit Stat */}
                <div className="bg-[#BDCDB3] rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Profit ($)</div>
                  <div className="text-3xl font-bold">
                    {totalProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Sold</div>
                </div>

                {/* Total Orders Stat */}
                <div className="bg-[#BDCDB3] rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Orders</div>
                  <div className="text-3xl font-bold">{orders.length}</div>
                  <div className="text-xs text-gray-500">Sold</div>
                </div>

                {/* Orders Picked Up Stat */}
                <div className="bg-[#BDCDB3] rounded-lg p-4">
                  <div className="text-sm text-gray-600">Orders Picked Up</div>
                  <div className="text-3xl font-bold">
                    {totalOrdersPickedUp}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
            </div>

            {/* Goal Progress Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Goal</h2>
              <div className="flex justify-center items-center h-40">
                <div className="relative">
                  {/* SVG Circle showing progress */}
                  <svg className="w-32 h-32" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#C9E4C7"
                      strokeWidth="3"
                    ></circle>

                    {/* Progress circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#138808"
                      strokeWidth="3"
                      strokeDasharray={`${progressPercent} ${
                        100 - progressPercent
                      }`}
                      strokeDashoffset="25"
                      transform="rotate(-90 18 18)"
                    ></circle>
                  </svg>

                  {/* Text in the middle */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">
                      ${totalProfit.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-500">
                      out of ${goalProfit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Stats Row */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Order Stats</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {/* Total Stats */}
              <div>
                <h3 className="text-lg font-medium mb-3">Total</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Orders Box */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 text-center text-sm text-gray-600 bg-gray-50">
                      Total Orders
                    </div>
                    <div className="p-4 bg-[#BDCDB3] text-center">
                      <div className="text-3xl font-bold">{orders.length}</div>
                      <div className="text-xs text-gray-500">Sold</div>
                    </div>
                  </div>

                  {/* Orders Pending Box */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 text-center text-sm text-gray-600 bg-gray-50">
                      Orders Pending
                    </div>
                    <div className="p-4 bg-[#BDCDB3] text-center">
                      <div className="text-3xl font-bold">
                        {orders.length - totalOrdersPickedUp}
                      </div>
                      <div className="text-xs text-gray-500">Left</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Stats */}
              <div>
                <h3 className="text-lg font-medium mb-3">Item(s)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Generate item stats boxes for top 3 items */}
                  {aggregatedItemSales
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="p-2 text-center text-sm text-gray-600 bg-gray-50 truncate">
                          {item.name}
                        </div>
                        <div className="p-4 bg-[#BDCDB3] text-center">
                          <div className="text-3xl font-bold">
                            {item.quantity}
                          </div>
                          <div className="text-xs text-gray-500">Sold</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart and Recent Orders Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Over Time Chart */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  Total Revenue Over Time
                </h2>
                {/* <div className="flex items-center text-sm text-gray-600">
                  Your key stats for the{" "}
                  <span className="text-blue-600 font-medium ml-1">
                    last 3 days
                  </span>
                </div> */}
              </div>
              <div className="p-4">
                {revenueData.length > 0 ? (
                  <RevenueChart initialData={revenueData} />
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buyer
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentOrders.map((order) => {
                        // Calculate order total
                        const orderTotal = order.items.reduce(
                          (sum, item) =>
                            sum + Number(item.item.price) * item.quantity,
                          0
                        );

                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">
                              {order.buyer.name}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {formatRelativeTime(new Date(order.createdAt))}
                            </td>

                            <td className="px-4 py-2">
                              <div className="max-h-24 overflow-y-auto">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="mb-1">
                                    <span className="font-medium">
                                      {item.quantity}x
                                    </span>{" "}
                                    {item.item.name}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              ${orderTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-center text-gray-500"
                          >
                            No recent orders
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Item Sales Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Item Sales</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aggregatedItemSales.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {aggregatedItemSales.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No items sold yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
