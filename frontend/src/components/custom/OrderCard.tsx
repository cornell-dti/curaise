import { CalendarIcon, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/custom/PaymentStatusBadge";
import { z } from "zod";
import { BasicOrderSchema } from "common";
import { Button } from "../ui/button";
import Link from "next/link";
import { format } from "date-fns";

const OrderCard = ({ order }: { order: z.infer<typeof BasicOrderSchema> }) => {
  const pickupEvents = order.fundraiser.pickupEvents;

  return (
    <Card className="overflow-hidden border border-gray-200 rounded-2xl">
      <CardHeader className="pb-3">
        {/* Mobile: badge on top, then text
            Desktop: text left, badge right (same as before) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="self-start sm:order-2">
            <PaymentStatusBadge order={order} />
          </div>
          <div className="sm:order-1">
            <CardTitle className="text-xl font-semibold">
              {order.fundraiser.name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              {order.fundraiser.organization.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 py-3 text-sm">
        {pickupEvents.length > 0 && (
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(pickupEvents[0].startsAt, "EEEE, M/d/yyyy")}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {pickupEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-medium">{event.location}</span>,{" "}
                {format(event.startsAt, "h:mm a")} to{" "}
                {format(event.endsAt, "h:mm a")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-between">
        <div className="text-xs text-gray-400">Order Id: {order.id}</div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 w-full text-sm sm:w-auto"
        >
          <Link href={`/buyer/order/${order.id}`}>View Order Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { OrderCard };
