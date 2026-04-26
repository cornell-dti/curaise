import { CalendarIcon, MapPinIcon, ShoppingBag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import Link from "next/link";
import { Button } from "../ui/button";
import Image from "next/image";
import { LocalDate } from "@/components/ui/LocalDate";

/**
 * Shared fundraiser card used in both buyer and seller pages.
 * @param seller - When true, "View Details" links to `/seller/fundraiser/[id]`.
 *   When false/omitted, links to `/buyer/fundraiser/[id]`.
 *   Must be passed in all seller-context usages.
 */
export function FundraiserCard({
  fundraiser,
  seller,
}: {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
  seller?: boolean;
}) {
  const now = new Date();
  const buyingStart = new Date(fundraiser.buyingStartsAt);
  const buyingEnd = new Date(fundraiser.buyingEndsAt);
  const isBuyingActive = now >= buyingStart && now <= buyingEnd;
  const isUpcoming = now < buyingStart;

  return (
    <Card className="overflow-hidden border shadow-sm h-full flex flex-col md:flex-row hover:shadow-md hover:translate-y-[-2px] transition-all duration-200">
      {/* Image Section - Left */}
      <div className="relative w-full md:w-2/5 aspect-[16/9] bg-gray-100 flex-shrink-0">
        {fundraiser.imageUrls && fundraiser.imageUrls.length > 0 ? (
          <Image
            src={fundraiser.imageUrls[0]}
            alt={fundraiser.name}
            fill
            className="object-cover"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>

      {/* Text Info Section - Right */}
      <div className="flex flex-col flex-1 min-w-0">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-base">{fundraiser.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                {fundraiser.description}
              </CardDescription>
              {fundraiser.organization && (
                <div className="text-xs text-gray-500 mt-1">
                  {fundraiser.organization.name}
                </div>
              )}
            </div>
            {/* Status Badge */}
            <div
              className={`py-1 px-3 rounded-full text-xs font-medium flex-shrink-0 ${
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
        </CardHeader>

        <CardContent className="pb-2 text-sm flex-1">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span>
                Buying Window:{" "}
                <b>
                  <LocalDate date={fundraiser.buyingStartsAt} formatStr="MMM d 'at' h:mm a" /> -{" "}
                  <LocalDate date={fundraiser.buyingEndsAt} formatStr="MMM d 'at' h:mm a" />
                </b>
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {fundraiser.pickupEvents.length === 1
                    ? "1 Pickup Event"
                    : `${fundraiser.pickupEvents.length} Pickup Events`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 flex mt-auto">
          <Button variant="outline" size="sm" className="h-8" asChild>
            <Link
              href={
                seller
                  ? `/seller/fundraiser/${fundraiser.id}`
                  : `/buyer/fundraiser/${fundraiser.id}`
              }
            >
              View Details
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
