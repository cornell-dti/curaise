import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	OVER_LIMIT_STRIPES,
	PENDING_STRIPES,
} from "../../components/StatusLegend";
import {
	ItemStat,
	formatCount,
	getShownUnits,
	getStockAlert,
	getUnitsOverLimit,
} from "./insights";

interface ItemsSoldCardProps {
	itemStats: ItemStat[];
	includePending: boolean;
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
	minWidth: units > 0 ? 2 : 0,
});

export function ItemsSoldCard({
	itemStats,
	includePending,
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
					const shown = getShownUnits(stat, includePending);
					const over = getUnitsOverLimit(stat, includePending);
					const confirmedWithin =
						stat.limit === null ? stat.confirmed : Math.min(stat.confirmed, stat.limit);
					const pendingWithin = shown - over - confirmedWithin;
					const rest = Math.max(0, (stat.limit ?? unlimitedScale) - shown);
					const stockAlert = getStockAlert(stat, includePending);
					const stockBadge = stockAlert && STOCK_BADGES[stockAlert];

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
									{stockBadge && (
										<Badge
											className={cn(
												"flex-none whitespace-nowrap",
												stockBadge.className
											)}>
											{stockBadge.label}
										</Badge>
									)}
								</div>
								<div aria-hidden="true" className="flex h-4 items-center">
									<div
										className="h-2 rounded-l bg-green-700"
										style={grow(confirmedWithin)}
									/>
									<div
										className={cn("h-2", PENDING_STRIPES)}
										style={grow(pendingWithin)}
									/>
									<div
										className={cn("h-2", stat.limit !== null && "bg-primary/20")}
										style={grow(rest)}
									/>
									{stat.limit !== null && (
										<div className="h-4 w-0.5 flex-none bg-foreground" />
									)}
									<div
										className={cn("h-2", OVER_LIMIT_STRIPES)}
										style={grow(over)}
									/>
								</div>
								<div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
									<span>
										<span className="font-semibold text-foreground">
											{formatCount(stat.confirmed)}
										</span>{" "}
										Confirmed
										{includePending && (
											<>
												{" + "}
												<span className="font-semibold text-foreground">
													{formatCount(stat.pending)}
												</span>{" "}
												Pending
											</>
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
