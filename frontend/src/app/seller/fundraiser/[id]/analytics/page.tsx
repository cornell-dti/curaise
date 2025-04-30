import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { processOrderAnalytics } from "@/app/seller/fundraiser/[id]/analytics/analytics";
import {
  calculateGoalProgress,
  processRevenueOverTime,
  processItemSales,
} from "./analytics-utils";
import dynamic from "next/dynamic";
import StatCard from "./components/StatsCard";
import GoalProgressCircle from "./components/GoalProgressCircle";
import ItemStatGrid from "./components/ItemStatGrid";
import RecentOrdersTable from "./components/RecentOrdersTable";
import ItemSalesTable from "./components/ItemSalesTable";
import NoAnalyticsMessage from "./components/NoAnalyticsMessage";
import { z } from "zod";
import {
  CompleteFundraiserSchema,
  CompleteOrderSchema,
  CompleteOrganizationSchema,
} from "common";
import { StringPriceOrder } from "./analytics";

// Dynamically import the chart component to handle client-side rendering
const RevenueChart = dynamic(() => import("./components/RevenueChart"));

type Order = z.infer<typeof CompleteOrderSchema>;
type OrderResponse = {
  data?: {
    cleanedOrders?: Order[];
  };
  message?: string;
};

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

export default async function FundraiserAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Authentication
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

  // Fetch data
  const fundraiser = await getFundraiser(id, session.access_token);
  const organization = await getOrganization(
    fundraiser.organization.id,
    session.access_token
  );
  const orders = await getOrdersByFundraiser(
    fundraiser.id,
    session.access_token
  );
  const recentOrders = await getRecentOrders(
    fundraiser.id,
    session.access_token,
    10
  );

  // Process data for analytics
  // Convert any Decimal price values to strings for compatibility
  const processableOrders: StringPriceOrder[] = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      item: {
        ...item.item,
        price: item.item.price.toString(),
      },
    })),
  }));

  const analytics = processOrderAnalytics(processableOrders);
  const revenueData = processRevenueOverTime(processableOrders, 30);
  const aggregatedItemSales = processItemSales(processableOrders);

  // Calculate values for summary cards
  const totalRevenue = analytics.totalRevenue;
  const totalOrdersPickedUp = analytics.totalOrdersPickedUp;
  const totalProfit = Number(totalRevenue) * 0.2; // Assuming 20% profit
  const goalProfit = fundraiser.goalAmount ? Number(fundraiser.goalAmount) : 0;
  const progressPercent = calculateGoalProgress(totalProfit, goalProfit);

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
        <NoAnalyticsMessage />
      ) : (
        <>
          {/* Key Stats and Goal Progress Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Key Stats Card */}
            <div className="bg-white rounded-lg shadow lg:col-span-3 p-6">
              <h2 className="text-xl font-semibold mb-4">Key Stats</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Revenue ($)"
                  value={Number(totalRevenue).toFixed(2)}
                  subtitle="Sold"
                />
                <StatCard
                  label="Total Profit ($)"
                  value={totalProfit.toFixed(2)}
                  subtitle="Sold"
                />
                <StatCard
                  label="Total Orders"
                  value={orders.length}
                  subtitle="Sold"
                />
                <StatCard
                  label="Orders Picked Up"
                  value={totalOrdersPickedUp}
                  subtitle="Completed"
                />
              </div>
            </div>

            {/* Goal Progress Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Goal</h2>
              <GoalProgressCircle
                currentAmount={totalProfit}
                goalAmount={goalProfit}
                progressPercent={progressPercent}
                hasGoal={goalProfit > 0}
              />
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
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 text-center text-sm text-gray-600 bg-gray-50">
                      Total Orders
                    </div>
                    <div className="p-4 bg-[#BDCDB3] text-center">
                      <div className="text-3xl font-bold">{orders.length}</div>
                      <div className="text-xs text-gray-500">Sold</div>
                    </div>
                  </div>

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
                <ItemStatGrid items={aggregatedItemSales} maxItems={3} />
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
                <RecentOrdersTable orders={recentOrders} />
              </div>
            </div>
          </div>

          {/* Item Sales Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Item Sales</h2>
            </div>
            <ItemSalesTable items={aggregatedItemSales} />
          </div>
        </>
      )}
    </div>
  );
}
