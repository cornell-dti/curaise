import {
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ShoppingBag,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";
import { BasicOrderSchema } from "common";
import { z } from "zod";
import { isFuture, format, differenceInCalendarDays, isPast } from "date-fns";

const PickupStatusBadge = ({
  order,
}: {
  order: z.infer<typeof BasicOrderSchema>;
}) => {
  let text = "";
  let color = "";
  let icon = null;
  let tooltipText = "";

  if (order.pickedUp) {
    text = "Picked Up";
    color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
    tooltipText = "Order has been picked up";
  } else if (isFuture(order.fundraiser.pickupStartsAt)) {
    text = `Pickup Starts in ${differenceInCalendarDays(
      order.fundraiser.pickupStartsAt,
      new Date()
    )} days`;
    color =
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    icon = <Clock className="mr-1 h-3 w-3" />;
    tooltipText = "Order pickup has not started yet";
  } else if (isPast(order.fundraiser.pickupEndsAt)) {
    text = "Pickup Has Ended";
    color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    icon = <Clock className="mr-1 h-3 w-3" />;
    tooltipText = "Order pickup has ended";
  } else {
    text = "Pickup Available";
    color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    icon = <ShoppingBag className="mr-1 h-3 w-3" />;
    tooltipText = "Order is available for pickup";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`flex items-center text-xs sm:text-sm px-2 py-1 ${color}`}
          >
            {icon}
            {text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { PickupStatusBadge };
