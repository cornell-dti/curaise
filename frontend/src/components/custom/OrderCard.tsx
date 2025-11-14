import { CalendarIcon, CreditCard, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PickupStatusBadge } from "@/components/custom/PickupStatusBadge";
import { z } from "zod";
import { BasicOrderSchema } from "common";
import { Button } from "../ui/button";
import Link from "next/link";
import { format, isPast } from "date-fns";

const OrderCard = ({ order }: { order: z.infer<typeof BasicOrderSchema> }) => {
  // Get the latest end time from pickup events
  const pickupEvents = order.fundraiser.pickupEvents;
  const latestEnd = pickupEvents.reduce(
    (latest, event) => (event.endsAt > latest ? event.endsAt : latest),
    pickupEvents[0].endsAt
  );

  const isActive = !isPast(latestEnd);

  return (
    <Card
      className={`overflow-hidden ${
        isActive ? "border-blue-200 bg-blue-50/50" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{order.fundraiser.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              {order.fundraiser.organization.name}
            </CardDescription>
          </div>
          <PickupStatusBadge order={order} />
        </div>
      </CardHeader>
      <CardContent className="pb-2 text-sm">
        <div className="grid gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {pickupEvents.length === 1
                  ? "Pickup Event"
                  : `${pickupEvents.length} Pickup Events`}
              </span>
            </div>
            {pickupEvents.map((event) => (
              <div key={event.id} className="ml-6 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>
                    <b>{event.location}</b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {isActive ? (
                      <b>
                        {format(event.startsAt, "MMM d 'at' h:mm a")} -{" "}
                        {format(event.endsAt, "MMM d 'at' h:mm a")}
                      </b>
                    ) : (
                      <span>
                        Ended on{" "}
                        {format(event.endsAt, "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>
              Paid via {order.paymentMethod === "VENMO" ? "Venmo" : "Other"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="text-xs text-muted-foreground">
          Order ID: {order.id}
        </div>
        <Button variant="outline" size="sm" className="h-8" asChild>
          <Link href={`/buyer/order/${order.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { OrderCard };
