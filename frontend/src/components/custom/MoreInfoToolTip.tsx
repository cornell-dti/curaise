import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  /** The informational text shown on hover */
  content: string;
  /** Optional size of the ? icon in pixels (default 18) */
  size?: number;
  className?: string;
}

export function InfoTooltip({
  content,
  size = 24,
  className,
}: InfoTooltipProps) {
  const px = Math.round(size);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className={cn(
            "inline-flex items-center justify-center rounded-full …",
            className,
          )}
          style={{ width: px, height: px }}
        >
          <HelpCircle
            className="h-[60%] w-[60%] text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-64 text-xs leading-relaxed"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
