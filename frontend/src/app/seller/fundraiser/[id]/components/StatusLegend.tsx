import { cn } from "@/lib/utils";

export const PENDING_BASE = "#DCFCE7";
export const PENDING_STRIPES =
  "bg-[repeating-linear-gradient(135deg,#15803D_0_2px,#DCFCE7_2px_5px)]";
export const OVER_LIMIT_STRIPES =
  "bg-[repeating-linear-gradient(135deg,#B91C1C_0_2px,#FEE2E2_2px_5px)]";

export function Swatch({
  className,
  color,
}: {
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={cn("size-3 flex-none rounded-[3px]", className)}
      style={color ? { background: color } : undefined}
    />
  );
}

export function ConfirmedLabel() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Swatch className="bg-green-700" />
      Confirmed
    </span>
  );
}

export function PendingLabel() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Swatch className={PENDING_STRIPES} />
      Pending
    </span>
  );
}
