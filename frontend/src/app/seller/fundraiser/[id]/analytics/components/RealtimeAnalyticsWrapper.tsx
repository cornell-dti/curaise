"use client";

import { useMemo, useState } from "react";
import { Banknote, Goal, Receipt } from "lucide-react";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";
import { usePendingProgress } from "@/hooks/usePendingProgress";
import { FoldX } from "../../components/Fold";
import { IncludePendingSwitch } from "../../components/IncludePendingSwitch";
import {
  ConfirmedLabel,
  OVER_LIMIT_STRIPES,
  PendingLabel,
  Swatch,
} from "../../components/StatusLegend";
import { useOrders } from "../../orders/components/OrdersProvider";
import { ProfitGoalChart } from "./ProfitGoalChart";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { ItemsSoldCard } from "./ItemsSoldCard";
import { InsightCard, StatCard } from "./InsightCard";
import {
  formatCount,
  formatMoney,
  getItemStats,
  getOrderCounts,
  getProfit,
  getRevenue,
  getUnitsOverLimit,
} from "./insights";
import { z } from "zod";
import { CompleteItemSchema } from "common";

type Item = z.infer<typeof CompleteItemSchema>;

const formatOrderCount = (value: number) => formatCount(Math.round(value));

interface RealtimeAnalyticsWrapperProps {
  goalAmount: number;
  items: Item[];
}

export function RealtimeAnalyticsWrapper({
  goalAmount,
  items,
}: RealtimeAnalyticsWrapperProps) {
  const { orders } = useOrders();
  const [includePending, setIncludePending] = useState(true);
  const pendingProgress = usePendingProgress(includePending);

  const itemStats = useMemo(() => getItemStats(items, orders), [items, orders]);
  const orderCounts = useMemo(() => getOrderCounts(orders), [orders]);
  const revenue = getRevenue(itemStats);
  const hasLimit = itemStats.some((stat) => stat.limit !== null);
  const isOverLimitAt = (progress: number) =>
    itemStats.some((stat) => getUnitsOverLimit(stat, progress) > 0);
  const overLimitProgress = isOverLimitAt(0)
    ? 1
    : isOverLimitAt(1)
    ? pendingProgress
    : 0;

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
        <div className="-ml-4 flex flex-wrap items-center gap-y-2 text-sm text-muted-foreground">
          <span className="flex pl-4">
            <ConfirmedLabel />
          </span>
          <FoldX progress={pendingProgress}>
            <span className="flex pl-4">
              <PendingLabel />
            </span>
          </FoldX>
          {hasLimit && (
            <span className="flex items-center gap-1.5 pl-4">
              <span className="h-3.5 w-0.5 flex-none bg-foreground" />
              Limit
            </span>
          )}
          <FoldX progress={overLimitProgress}>
            <span className="flex items-center gap-1.5 pl-4">
              <Swatch className={OVER_LIMIT_STRIPES} />
              Over limit
            </span>
          </FoldX>
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1.75_1_444px] flex-wrap gap-6">
          {/* First Column - Revenue and Total Orders stacked */}
          <div className="flex min-w-0 flex-[3_1_180px] flex-col gap-6">
            <StatCard
              icon={<Banknote className="shrink-0" />}
              title="Revenue"
              confirmed={revenue.confirmed}
              pending={revenue.pending}
              pendingProgress={pendingProgress}
              format={formatMoney}
            />
            <StatCard
              icon={<Receipt className="shrink-0" />}
              title="Total Orders"
              confirmed={orderCounts.confirmed}
              pending={orderCounts.pending}
              pendingProgress={pendingProgress}
              format={formatOrderCount}
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
              confirmedProfit={getProfit(revenue.confirmed)}
              pendingProfit={getProfit(revenue.pending)}
              goalAmount={goalAmount}
              includePending={includePending}
              pendingProgress={pendingProgress}
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
              pendingProgress={pendingProgress}
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
              pendingProgress={pendingProgress}
            />
          </InsightCard>
        </div>
      </div>
    </div>
  );
}
