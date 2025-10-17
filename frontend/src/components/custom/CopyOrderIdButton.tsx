"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyOrderIdButtonProps {
  orderId: string;
}

export function CopyOrderIdButton({ orderId }: CopyOrderIdButtonProps) {
  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied to clipboard!");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyOrderId}
      className="flex items-center gap-2"
    >
      <Copy className="h-4 w-4" />
      Copy ID
    </Button>
  );
}
