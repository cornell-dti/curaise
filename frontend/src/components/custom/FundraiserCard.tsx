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

          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              Pickup Location: <b>{fundraiser.pickupLocation}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              Pickup Window:{" "}
              <b>
                {format(fundraiser.pickupStartsAt, "MMM d 'at' h:mm a")} -{" "}
                {format(fundraiser.pickupEndsAt, "MMM d 'at' h:mm a")}
              </b>
            </span>
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
