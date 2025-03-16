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
  const isActive = !isPast(order.fundraiser.pickupEndsAt);

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
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {isActive ? (
                <span>
                  Pickup Window:{" "}
                  <b>
                    {format(
                      order.fundraiser.pickupStartsAt,
                      "MMM d 'at' h:mm a"
                    )}{" "}
                    -{" "}
                    {format(order.fundraiser.pickupEndsAt, "MMM d 'at' h:mm a")}
                  </b>
                </span>
              ) : (
                <span>
                  Pickup Ended on{" "}
                  {format(
                    order.fundraiser.pickupEndsAt,
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{order.fundraiser.pickupLocation}</span>
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
