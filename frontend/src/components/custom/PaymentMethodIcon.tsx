import { cn } from "@/lib/utils";

export type PaymentMethod = "VENMO" | "ZELLE" | "OTHER";

const sizeClasses = {
  sm: { box: "h-5 w-5", text: "text-[11px]" },
  md: { box: "h-7 w-7", text: "text-[15px]" },
} as const;

// Brand mark for a payment method. Used at checkout and in the seller orders
// table. OTHER is cash paid in person.
export function PaymentMethodIcon({
  method,
  size = "md",
}: {
  method: PaymentMethod;
  size?: keyof typeof sizeClasses;
}) {
  const { box, text } = sizeClasses[size];

  if (method === "VENMO") {
    return (
      <svg
        className={cn("shrink-0", box)}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Venmo"
        role="img"
        viewBox="0 0 512 512"
      >
        <rect width="512" height="512" rx="15%" fill="#008CFF" />
        <path
          d="m381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  const boxClass = cn(
    "flex shrink-0 items-center justify-center rounded font-bold text-white",
    box,
    text,
  );

  if (method === "ZELLE") {
    return (
      <div className={cn(boxClass, "bg-[#6d1ed4]")} aria-label="Zelle">
        Z
      </div>
    );
  }

  return (
    <div className={cn(boxClass, "bg-green-600")} aria-label="Cash">
      $
    </div>
  );
}
