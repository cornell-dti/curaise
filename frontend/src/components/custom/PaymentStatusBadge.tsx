import { CheckCircle2, CircleDollarSign, Clock } from "lucide-react";
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
      text = "Payment Confirmed";
      tooltipText = "Order payment confirmed";
      color =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "PENDING":
      text = "Payment Pending";
      color =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      icon = <Clock className="mr-1 h-3 w-3" />;
      tooltipText = "Awaiting order payment confirmation";
      break;
    case "UNVERIFIABLE":
      text = "Payment Unverifiable";
      color =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      icon = <CircleDollarSign className="mr-1 h-3 w-3" />;
      tooltipText = "Order payment unverifiable (e.g. cash payment)";
      break;
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

export { PaymentStatusBadge };
