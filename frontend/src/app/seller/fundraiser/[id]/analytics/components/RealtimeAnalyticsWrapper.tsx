"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Banknote, Goal, Receipt } from "lucide-react";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";
import { IncludePendingSwitch } from "../../components/IncludePendingSwitch";
import {
  ConfirmedLabel,
  OVER_LIMIT_STRIPES,
  PendingLabel,
  Swatch,
} from "../../components/StatusLegend";
import { ProfitGoalChart } from "./ProfitGoalChart";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { ItemsSoldCard } from "./ItemsSoldCard";
import { InsightCard, StatCard } from "./InsightCard";
import {
  formatCount,
  formatMoney,
  getItemStats,
  getUnitsOverLimit,
} from "./insights";
import { z } from "zod";
import { CompleteItemSchema, CompleteOrderSchema } from "common";

type Item = z.infer<typeof CompleteItemSchema>;
type Order = z.infer<typeof CompleteOrderSchema>;

const PROFIT_MARGIN = 0.2;

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
  const [includePending, setIncludePending] = useState(true);
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

  const itemStats = useMemo(() => getItemStats(items, orders), [items, orders]);
  const pendingRevenue = itemStats.reduce(
    (total, stat) => total + stat.pending * stat.price,
    0
  );
  const pendingProfit = Math.round(pendingRevenue * PROFIT_MARGIN * 100) / 100;
  const hasLimit = itemStats.some((stat) => stat.limit !== null);
  const hasOverLimit = itemStats.some(
    (stat) => getUnitsOverLimit(stat, includePending) > 0
  );

  return (
    <div className="mb-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h2 className="text-xl font-bold">Key Insights</h2>
          <IncludePendingSwitch
            checked={includePending}
            onCheckedChange={setIncludePending}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <ConfirmedLabel />
          {includePending && <PendingLabel />}
          {hasLimit && (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-0.5 flex-none bg-foreground" />
              Limit
            </span>
          )}
          {hasOverLimit && (
            <span className="flex items-center gap-1.5">
              <Swatch className={OVER_LIMIT_STRIPES} />
              Over limit
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1.75_1_444px] flex-wrap gap-6">
          {/* First Column - Revenue and Total Orders stacked */}
          <div className="flex min-w-0 flex-[3_1_180px] flex-col gap-6">
            <StatCard
              icon={<Banknote className="shrink-0" />}
              title="Revenue"
              confirmed={analytics.total_revenue}
              pending={pendingRevenue}
              includePending={includePending}
              format={formatMoney}
            />
            <StatCard
              icon={<Receipt className="shrink-0" />}
              title="Total Orders"
              confirmed={analytics.total_orders - analytics.pending_orders}
              pending={analytics.pending_orders}
              includePending={includePending}
              format={formatCount}
            />
          </div>

          {/* Profit Goal Card */}
          <InsightCard
            icon={<Goal className="shrink-0" />}
            title="Profit Goal"
            info={
              <InfoTooltip
                content="Profit is estimated using a 20% profit margin."
                size={18}
              />
            }
            className="flex-[4_1_240px] gap-4"
          >
            <ProfitGoalChart
              confirmedProfit={analytics.profit}
              pendingProfit={pendingProfit}
              goalAmount={goalAmount}
              includePending={includePending}
            />
          </InsightCard>
        </div>

        <div className="flex min-w-0 flex-[2.4_1_564px] flex-wrap gap-6">
          {/* Revenue Breakdown Card */}
          <InsightCard
            icon={<Receipt className="shrink-0" />}
            title="Revenue Breakdown"
            className="flex-[1_1_240px] gap-4"
          >
            <RevenueBreakdownChart
              itemStats={itemStats}
              includePending={includePending}
            />
          </InsightCard>

          {/* Items Sold Card */}
          <InsightCard
            icon={<Receipt className="shrink-0" />}
            title="Item Performance"
            info={
              <InfoTooltip
                content="Sorted by confirmed units sold. Inventory caps are affected only by confirmed or picked-up orders, not carts or unpaid pending orders."
                size={18}
              />
            }
            className="flex-[1.4_1_300px] gap-2"
          >
            <ItemsSoldCard
              itemStats={itemStats}
              includePending={includePending}
            />
          </InsightCard>
        </div>
      </div>
    </div>
  );
}
