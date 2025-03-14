import { CheckCircle2, Clock, CreditCard } from "lucide-react";
import { Badge } from "../ui/badge";

const OrderStatusBadge = ({ status }: { status: string }) => {
  let color = "";
  let icon = null;

  switch (status) {
    case "CONFIRMED":
      color =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "PENDING":
      color =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      icon = <Clock className="mr-1 h-3 w-3" />;
      break;
    case "UNVERIFIABLE":
      color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      icon = <CreditCard className="mr-1 h-3 w-3" />;
      break;
  }

  return (
    <Badge
      variant="outline"
      className={`flex items-center text-xs sm:text-sm px-2 py-1 ${color}`}
    >
      {icon}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
};

export { OrderStatusBadge };
