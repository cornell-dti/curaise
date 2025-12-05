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
import { format } from "date-fns";
import { Button } from "../ui/button";
import Image from "next/image";

export function FundraiserCard({
  fundraiser,
  seller,
}: {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
  seller?: boolean;
}) {
  const now = new Date();
  const isBuyingActive =
    now >= fundraiser.buyingStartsAt && now <= fundraiser.buyingEndsAt;
  const isUpcoming = now < fundraiser.buyingStartsAt;

  return (
    <Card className="overflow-hidden border shadow-sm h-full flex flex-col hover:shadow-md hover:translate-y-[-2px] transition-all duration-200">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100">
        {fundraiser.imageUrls && fundraiser.imageUrls.length > 0 ? (
          <Image
            src={fundraiser.imageUrls[0]}
            alt={fundraiser.name}
            fill
            className="object-cover"
            style={{ objectFit: 'cover' }}
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

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
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
        </div>
      </CardHeader>

      <CardContent className="pb-2 text-sm flex-1">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span>
              Buying Window:{" "}
              <b>
                {format(fundraiser.buyingStartsAt, "MMM d 'at' h:mm a")} -{" "}
                {format(fundraiser.buyingEndsAt, "MMM d 'at' h:mm a")}
              </b>
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {fundraiser.pickupEvents.length === 1
                  ? "Pickup Event"
                  : `${fundraiser.pickupEvents.length} Pickup Events`}
              </span>
            </div>
            {fundraiser.pickupEvents.map((event) => (
              <div key={event.id} className="ml-6 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                  <span>
                    <b>{event.location}</b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <span>
                    <b>
                      {format(event.startsAt, "MMM d 'at' h:mm a")} -{" "}
                      {format(event.endsAt, "MMM d 'at' h:mm a")}
                    </b>
                  </span>
                </div>
              </div>
            ))}
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
    </Card>
  );
}
