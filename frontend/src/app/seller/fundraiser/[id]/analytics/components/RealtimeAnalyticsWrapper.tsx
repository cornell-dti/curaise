"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Banknote, Goal, Receipt } from "lucide-react";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";
import { ProfitGoalChart } from "./ProfitGoalChart";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { ItemsSoldCard } from "./ItemsSoldCard";
import { z } from "zod";
import { CompleteItemSchema, CompleteOrderSchema } from "common";

type Item = z.infer<typeof CompleteItemSchema>;
type Order = z.infer<typeof CompleteOrderSchema>;

interface FundraiserAnalytics {
  total_revenue: number;
  total_orders: number;
  orders_picked_up: number;
  items: Record<string, number>;
  pending_orders: number;
  profit: number;
  goal_amount: number;
  sale_data: Record<string, number>;
  revenue_data: Record<string, number>;
  start_date: Date;
  end_date: Date;
}

interface RealtimeAnalyticsWrapperProps {
  initialAnalytics: FundraiserAnalytics;
  initialOrders: Order[];
  fundraiserId: string;
  token: string;
  goalAmount: number;
  items: Item[];
}

export function RealtimeAnalyticsWrapper({
  initialAnalytics,
  initialOrders,
  fundraiserId,
  token,
  goalAmount,
  items,
}: RealtimeAnalyticsWrapperProps) {
  const [analytics, setAnalytics] = useState<FundraiserAnalytics>(initialAnalytics);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const refetchData = async (forceRefresh = false) => {
      try {
        const analyticsUrl = forceRefresh
          ? `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/analytics?refresh=true`
          : `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/analytics`;

        const [analyticsResponse, ordersResponse] = await Promise.all([
          fetch(analyticsUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/orders`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const [analyticsResult, ordersResult] = await Promise.all([
          analyticsResponse.json(),
          ordersResponse.json(),
        ]);

        if (analyticsResponse.ok) {
          setAnalytics(analyticsResult.data);
        } else {
          console.error("Failed to refetch analytics:", analyticsResult.message);
        }

        if (ordersResponse.ok) {
          const parsedOrders = z.array(CompleteOrderSchema).safeParse(ordersResult.data);
          if (parsedOrders.success) {
            setOrders(parsedOrders.data);
          } else {
            console.error("Failed to parse refreshed orders:", parsedOrders.error);
          }
        } else {
          console.error("Failed to refetch orders:", ordersResult.message);
        }
      } catch (error) {
        console.error("Error refetching analytics data:", error);
      }
    };

    const belongsToFundraiser = (
      row: { fundraiser_id?: string } | null | undefined
    ) => row?.fundraiser_id === fundraiserId;

    let isCancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data } = await supabase.auth.getSession();
      const realtimeToken = data.session?.access_token ?? token;
      if (!realtimeToken) {
        return;
      }

      supabase.realtime.setAuth(realtimeToken);
      if (isCancelled) return;

      channel = supabase
        .channel(`analytics-${fundraiserId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `fundraiser_id=eq.${fundraiserId}`,
          },
          () => {
            refetchData(true);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            if (
              !belongsToFundraiser(
                payload.new as { fundraiser_id?: string } | null | undefined
              ) &&
              !belongsToFundraiser(
                payload.old as { fundraiser_id?: string } | null | undefined
              )
            ) {
              return;
            }
            refetchData(true);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            if (
              !belongsToFundraiser(
                payload.old as { fundraiser_id?: string } | null | undefined
              )
            ) {
              return;
            }
            refetchData(true);
          }
        )
        .subscribe();

      refetchData(true);
    };

    void setupRealtime();

    return () => {
      isCancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fundraiserId, token, supabase]);

  // Create a map of item name to price for revenue calculation
  const itemPriceMap = new Map<string, number>();
  items.forEach((item) => {
    itemPriceMap.set(item.name, Number(item.price));
  });

  // Calculate revenue per item
  const itemRevenue: Record<string, number> = {};
  Object.entries(analytics.items).forEach(([itemName, count]) => {
    const price = itemPriceMap.get(itemName) || 0;
    itemRevenue[itemName] = count * price;
  });

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-6">Key Insights</h2>
      <div className="grid grid-cols-[0.6fr_1fr_1fr_1.5fr] gap-6">
        {/* First Column - Revenue and Total Orders stacked */}
        <div className="flex flex-col gap-6 h-full">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2 font-semibold">
              <Banknote />
              Revenue
            </div>
            <div className="text-3xl font-semibold">
              ${analytics.total_revenue.toFixed(2)}
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-white rounded-lg shadow p-6 flex-1">
            <div className="flex items-center gap-2 mb-2 font-semibold">
              <Receipt />
              Total Orders
            </div>
            <div className="flex items-end gap-5">
              <div className="text-4xl font-semibold leading-none">
                {analytics.total_orders}
              </div>
              <div className="space-y-1.5 pb-0.5 text-sm leading-none text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">
                    {analytics.total_orders - analytics.pending_orders}
                  </span>{" "}
                  Confirmed
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {analytics.pending_orders}
                  </span>{" "}
                  Pending
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Goal Card */}
        <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4 font-semibold">
            <Goal />
            Profit Goal
            <InfoTooltip
              content="Profit is estimated using a 20% profit margin."
              size={18}
            />
          </div>
          <ProfitGoalChart
            profit={analytics.profit}
            goalAmount={goalAmount}
          />
        </div>

        {/* Revenue Breakdown Card */}
        <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4 font-semibold">
            <Receipt />
            Revenue Breakdown
          </div>
          <RevenueBreakdownChart
            itemRevenue={itemRevenue}
            totalRevenue={analytics.total_revenue}
          />
        </div>

        {/* Items Sold Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4 font-semibold">
            <Receipt />
            Item Performance
            <InfoTooltip
              content="Sorted by confirmed units sold. Inventory caps are affected only by confirmed or picked-up orders, not carts or unpaid pending orders."
              size={18}
            />
          </div>
          <ItemsSoldCard
            items={items}
            orders={orders}
          />
        </div>
      </div>
    </div>
  );
}
