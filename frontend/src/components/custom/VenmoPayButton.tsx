"use client";

import type { ComponentProps, MouseEvent } from "react";
import {
  detectVenmoPlatform,
  openVenmoWithFallback,
  venmoAndroidIntentUrl,
  venmoAppUrl,
  venmoWebUrl,
  type VenmoPayment,
} from "@/lib/venmo";

// extra anchor props are forwarded so this works as a <Button asChild> child
type VenmoPayButtonProps = VenmoPayment &
  Omit<ComponentProps<"a">, "href" | "target" | "rel">;

export function VenmoPayButton({
  username,
  amount,
  note,
  onClick,
  ...props
}: VenmoPayButtonProps) {
  const payment = { username, amount, note };
  const webUrl = venmoWebUrl(payment);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    const platform = detectVenmoPlatform(
      navigator.userAgent,
      navigator.maxTouchPoints,
    );

    // desktop opens venmo.com in a new tab, iOS Safari opens the app via the universal link
    if (platform === "desktop" || platform === "ios-safari") return;

    e.preventDefault();
    openVenmoWithFallback(
      platform === "android"
        ? venmoAndroidIntentUrl(payment)
        : venmoAppUrl(payment),
      webUrl,
    );
  };

  return (
    <a
      {...props}
      href={webUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
    />
  );
}
