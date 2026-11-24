import {
	PENDING_BASE,
	PENDING_STRIPES,
	Swatch,
} from "../../components/StatusLegend";
import { DonutRing } from "./DonutRing";
import { FitText } from "./FitText";
import { formatMoney, formatShortAmount } from "./insights";

interface ProfitGoalChartProps {
	confirmedProfit: number;
	pendingProfit: number;
	goalAmount: number;
	includePending: boolean;
}

const CONFIRMED_COLOR = "#15803D";
const REMAINING_COLOR = "#E5E7EB";
const INLINE_GOAL_MAX_CHARS = 10;

export function ProfitGoalChart({
	confirmedProfit,
	pendingProfit,
	goalAmount,
	includePending,
}: ProfitGoalChartProps) {
	const hasGoal = goalAmount > 0;
	const profit = includePending ? confirmedProfit + pendingProfit : confirmedProfit;
	const confirmedPercent = hasGoal
		? Math.min((confirmedProfit / goalAmount) * 100, 100)
		: 0;
	const pendingPercent =
		hasGoal && includePending
			? Math.min((pendingProfit / goalAmount) * 100, 100 - confirmedPercent)
			: 0;
	const remaining = Math.max(0, goalAmount - profit);
	const profitText = formatMoney(profit);
	const goalText = formatShortAmount(goalAmount);
	const showGoalInline =
		hasGoal && profitText.length + goalText.length <= INLINE_GOAL_MAX_CHARS;

	return (
		<>
			<DonutRing
				showTrack
				arcs={[
					{
						id: "confirmed",
						start: 0,
						length: confirmedPercent,
						color: CONFIRMED_COLOR,
						label: `Confirmed: ${formatMoney(confirmedProfit)}`,
					},
					{
						id: "pending",
						start: confirmedPercent,
						length: pendingPercent,
						color: CONFIRMED_COLOR,
						stripedOn: PENDING_BASE,
						label: `Pending: ${formatMoney(pendingProfit)}`,
					},
					{
						id: "remaining",
						start: confirmedPercent + pendingPercent,
						length: hasGoal ? 100 - confirmedPercent - pendingPercent : 0,
						color: REMAINING_COLOR,
						label: `Remaining: ${formatMoney(remaining)}`,
					},
				]}>
				<FitText align="center" className="text-2xl font-semibold">
					{profitText}
					{showGoalInline && (
						<span className="text-sm font-normal text-muted-foreground">
							/{goalText}
						</span>
					)}
				</FitText>
				<FitText align="center" className="text-sm text-muted-foreground">
					{hasGoal && !showGoalInline ? `of $${goalText} profit` : "profit"}
				</FitText>
			</DonutRing>
			<div className="flex flex-col gap-2 text-sm">
				<div className="flex items-center gap-2">
					<Swatch className="bg-green-700" />
					<span className="flex-1 text-muted-foreground">Confirmed</span>
					<span className="font-semibold">{formatMoney(confirmedProfit)}</span>
				</div>
				{includePending && (
					<div className="flex items-center gap-2">
						<Swatch className={PENDING_STRIPES} />
						<span className="flex-1 text-muted-foreground">Pending</span>
						<span className="font-semibold">
							+ {formatMoney(pendingProfit)}
						</span>
					</div>
				)}
				{hasGoal && (
					<div className="flex justify-between gap-2 border-t pt-2.5">
						<span className="text-muted-foreground">Remaining</span>
						<span className="font-semibold">
							{formatMoney(remaining)}
						</span>
					</div>
				)}
			</div>
		</>
	);
}
