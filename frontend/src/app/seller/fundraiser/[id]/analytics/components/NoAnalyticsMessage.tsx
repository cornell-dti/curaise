import React from "react";
import { BarChart2 } from "lucide-react";

export default function NoAnalyticsMessage() {
  return (
    <div className="p-8 text-center border rounded-lg bg-gray-50">
      <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-medium mb-2">No Analytics Data Yet</h3>
      <p className="text-muted-foreground mb-4">
        Analytics will appear here once your fundraiser has orders.
      </p>
    </div>
  );
}
