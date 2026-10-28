import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeRange } from "./browse-utils";

interface BrowseFundraiserCardProps {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
  calendarPickups?: z.infer<typeof BasicFundraiserSchema>["pickupEvents"];
}

export function BrowseFundraiserCard({ fundraiser, calendarPickups }: BrowseFundraiserCardProps) {
  const isPreorder = calendarPickups?.every((pickup) => fundraiser.buyingEndsAt < pickup.startsAt);
  return (
    <Link
      href={`/buyer/fundraiser/${fundraiser.id}`}
      className={cn("flex flex-col gap-[15px] w-full", calendarPickups && "gap-3 rounded-[8px] bg-white p-[10px] transition-shadow hover:shadow-md active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-[2px_2px_5px_0px_rgba(140,140,140,0.25)]")}
    >
      <div className={cn("bg-white aspect-[16/9] w-full rounded-md shadow-[2px_2px_5px_0px_rgba(140,140,140,0.25)] overflow-hidden relative", calendarPickups && "aspect-[2/1]")}>
        {fundraiser.imageUrls && fundraiser.imageUrls.length > 0 ? (
          <Image
            src={fundraiser.imageUrls[0]}
            alt={fundraiser.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {calendarPickups && (
          <span className={cn("absolute bottom-2 left-2 flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px]", isPreorder ? "bg-[#265B34] text-white" : "bg-[#C8DFCC] text-[#265B34]")}>
            <ShoppingBag aria-hidden="true" className="size-3" />
            {isPreorder ? "Pre-Order Form" : "Pick Up"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 w-full">
        <h3 className={cn("text-[20px] font-semibold leading-6 text-black", calendarPickups && "text-base font-bold leading-6")}>
          {fundraiser.name}
        </h3>
        <p className={cn("text-base font-normal leading-6 text-[#545454]", calendarPickups && "text-sm leading-5")}>
          {calendarPickups && "Hosted by: "}
          <span className={calendarPickups ? "underline" : undefined}>{fundraiser.organization?.name || "Organization"}</span>
        </p>
        {calendarPickups?.map((pickup) => (
          <div key={pickup.id} className="mt-1 flex flex-col gap-1 text-sm leading-5 text-black">
            <div className="flex items-start gap-1"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>{pickup.location || "Location to be announced"}</span></div>
            <div className="flex items-start gap-1"><Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>{formatTimeRange(pickup.startsAt, pickup.endsAt)}</span></div>
          </div>
        ))}
      </div>
    </Link>
  );
}
