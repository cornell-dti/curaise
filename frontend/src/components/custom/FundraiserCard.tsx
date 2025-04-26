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
  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-2">
        {/* TODO: ADD IMAGES */}
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{fundraiser.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              {fundraiser.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 text-sm">
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
      <CardFooter className="pt-2 flex ">
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
