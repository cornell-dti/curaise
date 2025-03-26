import {
  CalendarIcon,
  MapPinIcon,
  Clock,
  ShoppingBag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { z } from "zod";
import { CompleteFundraiserSchema } from "common";
import Link from "next/link";

// Helper function to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

// Helper function to format time
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(date));
};

// Helper to check if a fundraiser is active
const isFundraiserActive = (startDate: Date, endDate: Date) => {
  const now = new Date();
  return now >= new Date(startDate) && now <= new Date(endDate);
};
const isFundraiserPast = (endDate: Date) => {
  const now = new Date();
  return now > new Date(endDate);
};

type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;
type Fundraisers = Fundraiser[];

interface FundraiserDrawerContentProps {
  fundraisersArray: Fundraisers;
}

export function FundraiserCard({
  fundraisersArray,
}: FundraiserDrawerContentProps) {
  type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;
  return (
    <div className="pb-2">
      {fundraisersArray.length > 0 ? (
        <div className="space-y-8">
          {fundraisersArray.map((fundraiser: Fundraiser) => {
            const isActive = isFundraiserActive(
              fundraiser.buyingStartsAt,
              fundraiser.buyingEndsAt
            );
            const isPast = isFundraiserPast(fundraiser.buyingEndsAt);
            const fundraiserLink = `/buyer/fundraiser/${fundraiser.id}`
            return (
            <Link href={fundraiserLink} key={fundraiser.id}>
              <Card
                className="overflow-hidden border shadow-sm"
              >
                {fundraiser.imageUrls && fundraiser.imageUrls.length > 0 && (
                  <div className="relative w-full h-40 bg-muted">
                    <Image
                      src={fundraiser.imageUrls[0] || "/placeholder.svg"}
                      alt={fundraiser.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{fundraiser.name}</h3>
                    {!isPast ? (
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Upcoming"}{" "}
                      </Badge>
                    ) : (
                      <></>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {fundraiser.description}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            BUYING PERIOD
                          </p>
                          <p className="text-sm">
                            {formatDate(fundraiser.buyingStartsAt)}{" "}
                            {formatDate(fundraiser.buyingEndsAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPinIcon className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            PICKUP LOCATION
                          </p>
                          <p className="text-sm">{fundraiser.pickupLocation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            PICKUP DATE
                          </p>
                          <p className="text-sm">
                            {formatDate(fundraiser.pickupStartsAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            PICKUP TIME
                          </p>
                          <p className="text-sm">
                            {formatTime(fundraiser.pickupStartsAt)} -{" "}
                            {formatTime(fundraiser.pickupEndsAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">No active fundraisers</p>
          <p className="text-sm text-muted-foreground mt-1">
            There are currently no active fundraisers for this organization.
          </p>
        </div>
      )}
    </div>
  );
}
