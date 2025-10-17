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
    toast.success("Copied to clipboard!");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyOrderId}
      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}
