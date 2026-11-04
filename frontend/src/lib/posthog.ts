import posthog from "posthog-js";

/** Reset PostHog identity on sign-out. No-op when PostHog was never initialized (no NEXT_PUBLIC_POSTHOG_KEY). */
export function resetPostHog() {
  if (posthog.__loaded) {
    posthog.reset();
  }
}
