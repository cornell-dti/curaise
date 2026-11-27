import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	OVER_LIMIT_STRIPES,
	PENDING_STRIPES,
} from "../../components/StatusLegend";
import { ItemStat, formatCount, getBarUnits, getStockAlert } from "./insights";

interface ItemsSoldCardProps {
	itemStats: ItemStat[];
	includePending: boolean;
	pendingProgress: number;
}

const VISIBLE_ROWS = 4;

const STOCK_BADGES = {
	out: {
		label: "Out of Stock",
		className: "bg-red-100 text-red-700 hover:bg-red-100",
	},
	low: {
		label: "Low Stock",
		className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
	},
};

const grow = (units: number) => ({
	flex: `${units} 0 0px`,
	minWidth: Math.min(2, units * 2),
});

function StockBadges({
	stat,
	includePending,
	pendingProgress,
}: {
	stat: ItemStat;
	includePending: boolean;
	pendingProgress: number;
}) {
	const alertOff = getStockAlert(stat, false);
	const alertOn = getStockAlert(stat, true);
	const candidates =
		alertOff === alertOn
			? [{ alert: alertOn, opacity: 1, isOutgoing: false }]
			: [
					{
						alert: alertOff,
						opacity: 1 - pendingProgress,
						isOutgoing: includePending,
					},
					{
						alert: alertOn,
						opacity: pendingProgress,
						isOutgoing: !includePending,
					},
			  ];
	const badges = candidates.flatMap(({ alert, opacity, isOutgoing }) =>
		alert && opacity > 0
			? [{ ...STOCK_BADGES[alert], alert, opacity, isOutgoing }]
			: []
	);

	if (badges.length === 0) {
		return null;
	}
	return (
		<span className="grid flex-none justify-items-end">
			{badges.map((badge) => (
				<Badge
					key={badge.alert}
					aria-hidden={badge.isOutgoing || undefined}
					className={cn(
						"col-start-1 row-start-1 whitespace-nowrap",
						badge.className
					)}
					style={{ opacity: badge.opacity }}>
					{badge.label}
				</Badge>
			))}
		</span>
	);
}

export function ItemsSoldCard({
	itemStats,
	includePending,
	pendingProgress,
}: ItemsSoldCardProps) {
	const unlimitedScale = Math.max(
		0,
		...itemStats.map((stat) =>
			Math.max(stat.limit ?? 0, stat.confirmed + stat.pending)
		)
	);

	return (
		<div className="flex flex-1 flex-col justify-center">
			<div
				className={cn(
					itemStats.length > VISIBLE_ROWS &&
						"max-h-[336px] overflow-y-auto pr-3"
				)}>
				{itemStats.map((stat) => {
					const bar = getBarUnits(stat, { pendingProgress, unlimitedScale });

					return (
						<div key={stat.id} className="flex items-start gap-3 py-2">
							<span
								aria-hidden="true"
								className="flex size-10 flex-none items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
								{stat.name.charAt(0)}
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-1.5">
								<div className="flex items-start justify-between gap-2">
									<span
										className="line-clamp-2 min-w-0 break-words text-sm font-medium"
										title={stat.name}>
										{stat.name}
									</span>
									<StockBadges
										stat={stat}
										includePending={includePending}
										pendingProgress={pendingProgress}
									/>
								</div>
								<div aria-hidden="true" className="flex h-4 items-center">
									<div
										className="h-2 rounded-l bg-green-700"
										style={grow(bar.confirmed)}
									/>
									<div
										className={cn("h-2", PENDING_STRIPES)}
										style={grow(bar.pending)}
									/>
									<div
										className={cn("h-2", stat.limit !== null && "bg-primary/20")}
										style={grow(bar.rest)}
									/>
									{stat.limit !== null && (
										<div className="h-4 w-0.5 flex-none bg-foreground" />
									)}
									<div
										className={cn("h-2", OVER_LIMIT_STRIPES)}
										style={grow(bar.over)}
									/>
								</div>
								<div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
									<span>
										<span className="font-semibold text-foreground">
											{formatCount(stat.confirmed)}
										</span>{" "}
										Confirmed
										{pendingProgress > 0 && (
											<span style={{ opacity: pendingProgress }}>
												{" + "}
												<span className="font-semibold text-foreground">
													{formatCount(stat.pending)}
												</span>{" "}
												Pending
											</span>
										)}
									</span>
									<span>
										{stat.limit !== null
											? `Limit ${formatCount(stat.limit)}`
											: "No limit"}
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
