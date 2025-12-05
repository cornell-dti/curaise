import { CalendarIcon, MapPinIcon } from "lucide-react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "../ui/button";

export function FundraiserDraftCard({
	fundraiser,
}: {
	fundraiser: z.infer<typeof BasicFundraiserSchema>;
}) {
	return (
		<div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
			{/* Placeholder Image Section */}
			<div
				className="w-72 flex-shrink-0"
				style={{
					backgroundImage: `linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
                       linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
                       linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
                       linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)`,
					backgroundSize: "20px 20px",
					backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
					backgroundColor: "#f5f5f5",
				}}
			/>

			{/* Content Section */}
			<div className="flex-1 p-4 flex flex-col">
				<div className="flex-1">
					<h3 className="text-lg font-semibold">{fundraiser.name}</h3>
					{fundraiser.organization && (
						<p className="text-sm text-gray-500">
							{fundraiser.organization.name}
						</p>
					)}

					<div className="mt-3 space-y-1 text-sm">
						{/* Show buying date */}
						<div className="flex items-center gap-2">
							<CalendarIcon className="h-4 w-4 text-gray-400" />
							<span>{format(fundraiser.buyingStartsAt, "EEEE, M/d/yyyy")}</span>
						</div>

						{/* Show pickup events */}
						{fundraiser.pickupEvents.map((event) => (
							<div key={event.id} className="flex items-center gap-2">
								<MapPinIcon className="h-4 w-4 text-gray-400" />
								<span>
									{event.location}, {format(event.startsAt, "h:mm a")} to{" "}
									{format(event.endsAt, "h:mm a")}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Edit Button */}
				<div className="flex justify-end mt-4">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/seller/fundraiser/${fundraiser.id}`}>Edit</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
