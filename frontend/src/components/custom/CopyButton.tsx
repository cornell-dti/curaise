"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "ghost" | "outline" | "default" | "secondary" | "destructive" | "link";
}

export function CopyButton({ text, label, variant = "ghost" }: CopyButtonProps) {
  const copyText = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (label) {
    return (
      <Button
        variant={variant}
        size="lg"
        onClick={copyText}
        className="flex items-center gap-2 px-4 py-3 text-md"
      >
        <Copy className="h-4 w-4" />
        <span>{label}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={copyText}
      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}
