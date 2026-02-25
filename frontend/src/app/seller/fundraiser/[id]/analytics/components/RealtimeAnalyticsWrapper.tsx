"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Banknote, Goal, Receipt } from "lucide-react";
import { ProfitGoalChart } from "./ProfitGoalChart";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { ItemsSoldCard } from "./ItemsSoldCard";
import { z } from "zod";
import { CompleteItemSchema } from "common";

type Item = z.infer<typeof CompleteItemSchema>;

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
  fundraiserId: string;
  token: string;
  goalAmount: number;
  items: Item[];
}

export function RealtimeAnalyticsWrapper({
  initialAnalytics,
  fundraiserId,
  token,
  goalAmount,
  items,
}: RealtimeAnalyticsWrapperProps) {
  const [analytics, setAnalytics] = useState<FundraiserAnalytics>(initialAnalytics);
  const supabase = createClient();

  useEffect(() => {
    // Refetch analytics from API
    const refetchAnalytics = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setAnalytics(result.data);
        } else {
          console.error("Failed to refetch analytics:", result.message);
        }
      } catch (error) {
        console.error("Error refetching analytics:", error);
        // Keep existing data on error (graceful degradation)
      }
    };

    // Set up realtime subscription - listen to order changes
    const channel = supabase
      .channel(`analytics-${fundraiserId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "orders",
        },
        () => {
          // On any order change event, refetch analytics
          refetchAnalytics();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
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
      <div className="grid grid-cols-[0.6fr_0.8fr_1fr_1.5fr] gap-6">
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
            <div className="text-3xl font-semibold">
              {analytics.total_orders}
            </div>
          </div>
        </div>

        {/* Profit Goal Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4 font-semibold">
            <Goal />
            Profit Goal
          </div>
          <ProfitGoalChart
            profit={0}
            goalAmount={goalAmount}
          />
        </div>

        {/* Revenue Breakdown Card */}
        <div className="bg-white rounded-lg shadow p-6">
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
            Items Sold
          </div>
          <ItemsSoldCard items={analytics.items} />
        </div>
      </div>
    </div>
  );
}
