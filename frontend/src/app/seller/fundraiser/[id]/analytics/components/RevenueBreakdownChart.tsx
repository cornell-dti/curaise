import { cn } from "@/lib/utils";
import { PENDING_BASE, Swatch } from "../../components/StatusLegend";
import { DonutRing, RingArc } from "./DonutRing";
import { FitText } from "./FitText";
import {
  ItemStat,
  formatMoney,
  formatShortAmount,
  getRevenue,
} from "./insights";

interface RevenueBreakdownChartProps {
  itemStats: ItemStat[];
  includePending: boolean;
}

// Vibrant green shades
const greenShades = [
  "#10b981", // Vibrant emerald
  "#059669", // Deeper emerald
  "#34d399", // Bright light green
  "#047857", // Dark forest green
  "#6ee7b7", // Light mint green
  "#22c55e", // Green 500
  "#16a34a", // Green 600
  "#84cc16", // Lime 500
];

const SEGMENT_GAP = 0.6;
const MIN_SEGMENT = 0.2;

const AMOUNT_CHAR_PX = 7.5;
const CONFIRMED_COLUMN_MIN_PX = 58;
const PENDING_COLUMN_MIN_PX = 56;

const ROW = "col-span-3 grid grid-cols-subgrid";
const AMOUNT = "whitespace-nowrap text-right font-semibold tabular-nums";
const STACKED_NAME = "[@container(max-width:20rem)]:col-span-3";
const STACKED_CONFIRMED = "[@container(max-width:20rem)]:col-start-2";

const longest = (texts: string[]) =>
  Math.max(0, ...texts.map((text) => text.length));

export function RevenueBreakdownChart({
  itemStats,
  includePending,
}: RevenueBreakdownChartProps) {
  const rows = itemStats
    .filter((stat) => stat.confirmed + stat.pending > 0)
    .map((stat, index) => ({
      id: stat.id,
      name: stat.name,
      color: greenShades[index % greenShades.length],
      confirmed: stat.confirmed * stat.price,
      pending: stat.pending * stat.price,
    }));
  const { confirmed: confirmedTotal, pending: pendingTotal } =
    getRevenue(itemStats);
  const revenue = includePending ? confirmedTotal + pendingTotal : confirmedTotal;

  const arcs: RingArc[] = [];
  let position = 0;
  rows.forEach((row) => {
    const confirmedLength = revenue > 0 ? (row.confirmed / revenue) * 100 : 0;
    const pendingLength =
      includePending && revenue > 0 ? (row.pending / revenue) * 100 : 0;
    const trimmed = (length: number) =>
      Math.max(length - SEGMENT_GAP, MIN_SEGMENT);

    if (confirmedLength > 0) {
      arcs.push({
        id: `${row.id}:confirmed`,
        start: position,
        length: pendingLength > 0 ? confirmedLength : trimmed(confirmedLength),
        color: row.color,
        label: `${row.name}: ${formatMoney(row.confirmed)}`,
      });
    }
    if (pendingLength > 0) {
      arcs.push({
        id: `${row.id}:pending`,
        start: position + confirmedLength,
        length: trimmed(pendingLength),
        color: row.color,
        stripedOn: PENDING_BASE,
        label: `${row.name} (Pending): ${formatMoney(row.pending)}`,
      });
    }
    position += confirmedLength + pendingLength;
  });

  const confirmedText = (amount: number) => `$${formatShortAmount(amount)}`;
  const pendingText = (amount: number) =>
    includePending ? `+ $${formatShortAmount(amount)}` : "";
  const tableRows = [
    ...rows.map((row) => ({
      id: row.id,
      confirmed: confirmedText(row.confirmed),
      pending: pendingText(row.pending),
    })),
    {
      id: "total",
      confirmed: confirmedText(confirmedTotal),
      pending: pendingText(pendingTotal),
    },
  ];
  const amountsWidth =
    Math.max(
      CONFIRMED_COLUMN_MIN_PX,
      longest(tableRows.map((row) => row.confirmed)) * AMOUNT_CHAR_PX
    ) +
    Math.max(
      PENDING_COLUMN_MIN_PX,
      longest(tableRows.map((row) => row.pending)) * AMOUNT_CHAR_PX
    );
  const stackNames =
    amountsWidth > CONFIRMED_COLUMN_MIN_PX + PENDING_COLUMN_MIN_PX;

  return (
    <>
      <DonutRing arcs={arcs} showTrack={revenue <= 0}>
        <FitText align="center" className="text-2xl font-semibold">
          {formatMoney(revenue)}
        </FitText>
        <span className="text-sm text-muted-foreground">revenue</span>
      </DonutRing>
      <div className="[container-type:inline-size]">
        <div className="grid max-h-[260px] grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 overflow-y-auto text-sm">
          <div
            className={cn(
              ROW,
              "sticky top-0 bg-white pb-1 text-xs text-muted-foreground"
            )}>
            <span className="col-start-2 text-right">Confirmed</span>
            <span className="min-w-14 text-right">
              {includePending && "Pending"}
            </span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className={cn(ROW, "py-1")}>
              <span
                className={cn(
                  "flex min-w-0 items-start gap-2",
                  stackNames && STACKED_NAME
                )}>
                <Swatch color={row.color} className="mt-1" />
                <span
                  className="line-clamp-3 min-w-0 break-words"
                  title={row.name}>
                  {row.name}
                </span>
              </span>
              <span className={cn(AMOUNT, stackNames && STACKED_CONFIRMED)}>
                {confirmedText(row.confirmed)}
              </span>
              <span className={AMOUNT}>{pendingText(row.pending)}</span>
            </div>
          ))}
          <div className={cn(ROW, "sticky bottom-0 mt-1 border-t bg-white pt-2")}>
            <span
              className={cn(
                "pl-5 text-muted-foreground",
                stackNames && STACKED_NAME
              )}>
              Total
            </span>
            <span className={cn(AMOUNT, stackNames && STACKED_CONFIRMED)}>
              {confirmedText(confirmedTotal)}
            </span>
            <span className={AMOUNT}>{pendingText(pendingTotal)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
