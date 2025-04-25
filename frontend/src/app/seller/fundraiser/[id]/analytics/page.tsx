import { RefreshCw, BarChart2 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { AnalyticsSummaryCard } from "@/app/seller/fundraiser/[id]/components/AnalyticsSummary";
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

  // Calculate values needed for the summary card
  const totalOrderAmount = analytics.totalRevenue;
  const totalOrdersPickedUp = analytics.totalOrdersPickedUp;

  return (
    <div className="p-6">
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
          <AnalyticsSummaryCard
            fundraiser={fundraiser}
            raised={Number(totalOrderAmount)}
            itemsPicked={totalOrdersPickedUp}
            totalOrders={orders.length}
            profit={23}
          />

          {/* Item Sales Breakdown */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Item Sales</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
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
                  {analytics.processedItems.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${item.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${item.total}
                      </td>
                    </tr>
                  ))}
                  {analytics.processedItems.length === 0 && (
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

          {/* Revenue Chart and Recent Orders in a row */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Over Time Chart */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  Total Revenue Over Time
                </h2>
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
        </>
      )}
    </div>
  );
}
