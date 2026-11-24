import { cn } from "@/lib/utils";
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
	includePending: boolean;
	format: (value: number) => string;
}

export function StatCard({
	icon,
	title,
	confirmed,
	pending,
	includePending,
	format,
}: StatCardProps) {
	const total = confirmed + pending;
	const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

	return (
		<InsightCard icon={icon} title={title} className="flex-1 gap-2">
			<FitText className="text-3xl font-semibold">
				{format(includePending ? total : confirmed)}
			</FitText>
			{includePending ? (
				<div className="flex flex-col gap-2">
					<div className="my-1 flex h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							className="bg-green-700"
							style={{ width: `${share(confirmed)}%` }}
						/>
						<div
							className={PENDING_STRIPES}
							style={{ width: `${share(pending)}%` }}
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
			) : (
				<span className="text-sm text-muted-foreground">Confirmed orders only</span>
			)}
		</InsightCard>
	);
}
