import Link from "next/link";
import { CircleAlert, X } from "lucide-react";
import { BasicFundraiserSchema } from "common";
import { z } from "zod";

export function PickupOverlapWarning({
	fundraisers,
	onViewCalendar,
	onDismiss,
}: {
	fundraisers: z.infer<typeof BasicFundraiserSchema>[];
	onViewCalendar: () => void;
	onDismiss: () => void;
}) {
	const [first, ...rest] = fundraisers;

	return (
		<div
			role="status"
			className="flex items-start gap-3 rounded-md border border-[#DDDDDD] bg-[#FFF6D4] px-3.5 py-2">
			<div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<div className="min-w-0">
					<p className="flex items-center gap-1.5 text-sm font-semibold leading-[21px] text-black">
						<CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
						{rest.length === 0
							? "Another fundraiser overlaps with this pickup event."
							: `${fundraisers.length} other fundraisers overlap with this pickup event.`}
					</p>
					<p className="mt-0.5 text-[13px] leading-[17.6px] tracking-[-0.02em] text-[#545454]">
						<Link
							href={`/buyer/fundraiser/${first.id}`}
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-black">
							{first.organization.name}
						</Link>
						&rsquo;s fundraiser
						{rest.length > 0 &&
							` and ${rest.length} other${rest.length === 1 ? "" : "s"}`}{" "}
						could affect buyer turnout.
					</p>
				</div>
				<button
					type="button"
					onClick={onViewCalendar}
					className="self-start whitespace-nowrap text-[13px] leading-[17.6px] tracking-[-0.02em] text-black underline hover:opacity-70 sm:self-auto">
					View Calendar
				</button>
			</div>
			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss overlap warning"
				className="shrink-0 text-black hover:opacity-70 sm:self-center">
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}
