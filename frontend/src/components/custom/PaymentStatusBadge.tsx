import {
  CircleDollarSign,
  TriangleAlert,
  CircleCheckBig,
  Package2,
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

const PaymentStatusBadge = ({
  order,
}: {
  order: z.infer<typeof BasicOrderSchema>;
}) => {
  let text = "";
  let color = "";
  let icon = null;
  let tooltipText = "";

  switch (order.paymentStatus) {
    case "CONFIRMED":
      text = "Payment Verified";
      tooltipText = "Order payment verified";
      color =
        "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-300";
      icon = <CircleCheckBig className="mr-1 h-4 w-4" />;
      break;
    case "PENDING":
      text = "Payment Pending";
      color =
        "bg-amber-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      icon = <TriangleAlert className="mr-1 h-4 w-4" />;
      tooltipText = "Awaiting order payment confirmation";
      break;
    case "UNVERIFIABLE":
      text = "Payment Unverifiable";
      color =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      icon = <CircleDollarSign className="mr-1 h-4 w-4" />;
      tooltipText = "Order payment unverifiable (e.g. cash payment)";
      break;
  }
  if (order.pickedUp === true) {
    text = "Order Picked Up";
    color = "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    icon = <Package2 className="mr-1 h-4 w-4" />;
    tooltipText = "Order has been picked up";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`border-transparent flex items-center text-xs sm:text-sm px-4 py-2 gap-1 ${color}`}
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

export { PaymentStatusBadge };
