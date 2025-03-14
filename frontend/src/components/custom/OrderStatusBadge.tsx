import { CheckCircle2, CircleDollarSign, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";

const OrderStatusBadge = ({ status }: { status: string }) => {
  let color = "";
  let icon = null;
  let tooltipText = "";

  switch (status) {
    case "CONFIRMED":
      color =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      tooltipText = "Order payment confirmed";
      break;
    case "PENDING":
      color =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      icon = <Clock className="mr-1 h-3 w-3" />;
      tooltipText = "Awaiting order payment confirmation";
      break;
    case "UNVERIFIABLE":
      color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
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
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { OrderStatusBadge };
