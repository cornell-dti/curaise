// TODO: REMOVE FILE AND MERGE IT INTO OLD FUNDRAISER CARD

"use client";

import { format } from "date-fns";
import { MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { BasicFundraiserSchema } from "common";
import type { z } from "zod";

export function FundraiserCard({
  fundraiser,
}: {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
}) {
  const now = new Date();
  const isBuyingActive =
    now >= fundraiser.buyingStartsAt && now <= fundraiser.buyingEndsAt;
  const isUpcoming = now < fundraiser.buyingStartsAt;

  return (
    <Link href={`/buyer/fundraiser/${fundraiser.id}`}>
      <div className="border rounded-lg overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
        {/* Card Header with Image */}
        <div className="relative h-48 bg-gray-100">
          {fundraiser.imageUrls.length > 0 ? (
            <img
              src={fundraiser.imageUrls[0]}
              alt={fundraiser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Status Badge */}
          <div
            className={`absolute top-3 right-3 py-1 px-3 rounded-full text-xs font-medium ${
              isBuyingActive
                ? "bg-green-100 text-green-800"
                : isUpcoming
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isBuyingActive ? "Active" : isUpcoming ? "Upcoming" : "Ended"}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">
              {fundraiser.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {fundraiser.description}
            </p>

            <div className="text-xs text-gray-500 mb-1">
              {fundraiser.organization.name}
            </div>
          </div>

          <div className="pt-4 border-t mt-auto">
            <div className="flex items-center text-xs text-gray-600 mb-2">
              <ShoppingBag className="h-3 w-3 mr-2" />
              <span>
                {format(fundraiser.buyingStartsAt, "MMM d")} -{" "}
                {format(fundraiser.buyingEndsAt, "MMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="h-3 w-3 mr-2" />
              <span className="line-clamp-1">{fundraiser.pickupLocation}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
