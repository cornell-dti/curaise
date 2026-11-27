import { cn } from "@/lib/utils";
import { FoldY } from "../../components/Fold";
import { PENDING_STRIPES, Swatch } from "../../components/StatusLegend";
import { FitText } from "./FitText";

interface InsightCardProps {
	icon: React.ReactNode;
	title: string;
	info?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}

export function InsightCard({
	icon,
	title,
	info,
	className,
	children,
}: InsightCardProps) {
	return (
		<section
			className={cn(
				"flex min-w-0 flex-col rounded-lg bg-white p-6 shadow",
				className
			)}>
			<div className="flex items-center gap-2">
				{icon}
				<h3 className="whitespace-nowrap font-semibold">{title}</h3>
				{info}
			</div>
			{children}
		</section>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	title: string;
	confirmed: number;
	pending: number;
	pendingProgress: number;
	format: (value: number) => string;
}

export function StatCard({
	icon,
	title,
	confirmed,
	pending,
	pendingProgress,
	format,
}: StatCardProps) {
	const shownPending = pending * pendingProgress;
	const total = confirmed + shownPending;
	const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

	return (
		<InsightCard icon={icon} title={title} className="flex-1 gap-2">
			<FitText className="text-3xl font-semibold tabular-nums">
				{format(total)}
			</FitText>
			<div>
				<FoldY progress={pendingProgress}>
					<div className="flex flex-col gap-2">
						<div className="my-1 flex h-2 overflow-hidden rounded-full bg-gray-200">
							<div
								className="bg-green-700"
								style={{ width: `${share(confirmed)}%` }}
							/>
							<div
								className={PENDING_STRIPES}
								style={{ width: `${share(shownPending)}%` }}
							/>
						</div>
						<div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
							<span className="flex items-center gap-2">
								<Swatch className="bg-green-700" />
								<span>
									<span className="font-semibold text-foreground">
										{format(confirmed)}
									</span>{" "}
									Confirmed
								</span>
							</span>
							<span className="flex items-center gap-2">
								<Swatch className={PENDING_STRIPES} />
								<span>
									<span className="font-semibold text-foreground">
										{format(pending)}
									</span>{" "}
									Pending
								</span>
							</span>
						</div>
					</div>
				</FoldY>
				<FoldY progress={1 - pendingProgress}>
					<p className="text-sm text-muted-foreground">
						Confirmed orders only
					</p>
				</FoldY>
			</div>
		</InsightCard>
	);
}
