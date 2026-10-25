"use client";

import type { ComponentProps, MouseEvent } from "react";
import {
  detectVenmoPlatform,
  venmoAndroidIntentUrl,
  venmoAppUrl,
  venmoWebUrl,
  type VenmoPayment,
} from "@/lib/venmo";

// how long to wait for the app to take over before falling back to the web link
const APP_OPEN_TIMEOUT_MS = 2000;

// extra anchor props are forwarded so this works as a <Button asChild> child
type VenmoPayButtonProps = VenmoPayment &
  Omit<ComponentProps<"a">, "href" | "target" | "rel">;

function openWithFallback(appUrl: string, fallbackUrl: string) {
  const cleanup = () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", cancel);
    window.removeEventListener("blur", cancel);
  };
  const cancel = () => cleanup();
  const onHide = () => {
    if (document.visibilityState === "hidden") cleanup();
  };
  const timer = window.setTimeout(() => {
    cleanup();
    window.location.href = fallbackUrl;
  }, APP_OPEN_TIMEOUT_MS);

  // the page goes to the background (or shows the "Open in Venmo?" prompt) once the app takes over
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", cancel);
  window.addEventListener("blur", cancel);

  window.location.href = appUrl;
}

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
    openWithFallback(
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
