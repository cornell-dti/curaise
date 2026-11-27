import { FoldY } from "../../components/Fold";
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
	pendingProgress: number;
}

const CONFIRMED_COLOR = "#15803D";
const REMAINING_COLOR = "#E5E7EB";
const INLINE_GOAL_MAX_CHARS = 10;

export function ProfitGoalChart({
	confirmedProfit,
	pendingProfit,
	goalAmount,
	includePending,
	pendingProgress,
}: ProfitGoalChartProps) {
	const hasGoal = goalAmount > 0;
	const totalProfit = confirmedProfit + pendingProfit;
	const profit = confirmedProfit + pendingProfit * pendingProgress;
	const confirmedPercent = hasGoal
		? Math.min((confirmedProfit / goalAmount) * 100, 100)
		: 0;
	const pendingPercent = hasGoal
		? Math.min(
				((pendingProfit * pendingProgress) / goalAmount) * 100,
				100 - confirmedPercent
		  )
		: 0;
	const remaining = Math.max(0, goalAmount - profit);
	const settledRemaining = Math.max(
		0,
		goalAmount - (includePending ? totalProfit : confirmedProfit)
	);
	const goalText = formatShortAmount(goalAmount);
	const longestProfitText = Math.max(
		formatMoney(confirmedProfit).length,
		formatMoney(totalProfit).length
	);
	const showGoalInline =
		hasGoal && longestProfitText + goalText.length <= INLINE_GOAL_MAX_CHARS;

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
						label: `Remaining: ${formatMoney(settledRemaining)}`,
					},
				]}>
				<FitText
					align="center"
					className="text-2xl font-semibold tabular-nums">
					{formatMoney(profit)}
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
			<div className="flex flex-col text-sm">
				<div className="flex items-center gap-2">
					<Swatch className="bg-green-700" />
					<span className="flex-1 text-muted-foreground">Confirmed</span>
					<span className="font-semibold">{formatMoney(confirmedProfit)}</span>
				</div>
				<FoldY progress={pendingProgress}>
					<div className="flex items-center gap-2 pt-2">
						<Swatch className={PENDING_STRIPES} />
						<span className="flex-1 text-muted-foreground">Pending</span>
						<span className="font-semibold">
							+ {formatMoney(pendingProfit)}
						</span>
					</div>
				</FoldY>
				{hasGoal && (
					<div className="mt-2 flex justify-between gap-2 border-t pt-2.5">
						<span className="text-muted-foreground">Remaining</span>
						<span className="font-semibold tabular-nums">
							{formatMoney(remaining)}
						</span>
					</div>
				)}
			</div>
		</>
	);
}
