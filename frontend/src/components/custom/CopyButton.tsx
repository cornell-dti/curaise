"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const copyText = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyText}
      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}
