# Venmo Payment Links

When a buyer pays for an order with Venmo, CURaise opens Venmo with the seller, the amount and the order ID already filled in. The order ID is the Venmo note, and it is how payments are matched to orders, so the buyer must never have to retype it.

Browsers differ in whether a link can open the Venmo app. This module picks the right link for each browser and falls back to venmo.com when the app doesn't open.

| File | Purpose |
| --- | --- |
| `frontend/src/lib/venmo.ts` | URL builders, platform detection, app-open fallback (no React) |
| `frontend/src/components/custom/VenmoPayButton.tsx` | `<VenmoPayButton>`, the link component that uses them |
| `frontend/src/lib/venmo.test.ts` | Unit tests (`cd frontend && pnpm test`) |

## Quick start

```tsx
import { VenmoPayButton } from "@/components/custom/VenmoPayButton";
import { Button } from "@/components/ui/button";

<Button asChild>
  <VenmoPayButton username={fundraiser.venmoUsername} amount="6.00" note={order.id}>
    Pay with Venmo
  </VenmoPayButton>
</Button>
```

For a link the buyer copies and pastes somewhere else, always use the web link. It works everywhere:

```ts
venmoWebUrl({ username, amount, note }); // "https://venmo.com/{username}?txn=pay&note=...&amount=..."
```

## What happens on tap

| Platform (`detectVenmoPlatform`) | Link opened | If Venmo is not installed |
| --- | --- | --- |
| `desktop` | `https://venmo.com/...` in a new tab | n/a |
| `ios-safari` (iPhone and iPad Safari) | `https://venmo.com/...`, which iOS opens in the app as a universal link | venmo.com in a new tab |
| `ios-other` (Chrome, Firefox, Edge, Instagram, Facebook, GroupMe, other in-app browsers) | `venmo://paycharge?...` in the same tab | venmo.com in the same tab after 2s |
| `android` (Chrome and in-app WebViews) | `intent://paycharge?...#Intent;scheme=venmo;package=com.venmo;...` | Chrome opens the intent's `browser_fallback_url`, or the 2s fallback fires |

The rendered `href` is always the web link. That way a long-press, "open in new tab", a crawler, or a browser where JavaScript failed still gets a working link.

## API reference

### `type VenmoPayment = { username: string; amount: string; note: string }`

- `username`: Venmo handle without `@`.
- `amount`: a decimal string. Pass it pre-formatted (`"6.00"`, e.g. `Decimal.toFixed(2)`). The module does not format or validate it.
- `note`: free text. CURaise passes the order ID. Every field is URL-encoded, so spaces, `&`, `#` and `=` are safe.

### `<VenmoPayButton {...VenmoPayment} {...anchorProps}>`

A client component that renders an `<a>`. It accepts every `<a>` prop except `href`, `target` and `rel`, which it sets itself. It also forwards `className` and the other props that `<Button asChild>` passes down.

- **Side effects on click:** on `ios-other` and `android` it cancels the default navigation, sets `window.location.href` to the app link, and may navigate the current tab to venmo.com 2s later (see `openVenmoWithFallback`). On `desktop` and `ios-safari` it does nothing and the browser follows the link.
- If you pass your own `onClick`, it runs first. Call `e.preventDefault()` in it to stop the payment flow, for example to block payment for an order that can't be confirmed.

### URL builders: `(payment: VenmoPayment) => string`

Pure functions. Each runs in O(n) in the length of the inputs.

| Function | Returns |
| --- | --- |
| `venmoWebUrl` | `https://venmo.com/{username}?txn=pay&note={note}&amount={amount}` |
| `venmoAppUrl` | `venmo://paycharge?txn=pay&recipients={username}&amount={amount}&note={note}` |
| `venmoAndroidIntentUrl` | The same query as an Android intent for `com.venmo`, with `venmoWebUrl` (encoded) as `S.browser_fallback_url` |

### `detectVenmoPlatform(userAgent: string, maxTouchPoints = 0): VenmoPlatform`

Returns `"desktop" | "ios-safari" | "ios-other" | "android"`. It is a pure function, O(n) in the user agent length, and uses a few regex tests. Call it in the browser with `navigator.userAgent, navigator.maxTouchPoints`.

- **iPadOS** reports a Mac user agent. A Mac user agent with more than one touch point is treated as iOS. Leaving `maxTouchPoints` out makes every Mac `desktop`.
- **Safari vs. not Safari:** it only returns `ios-safari` when the user agent contains `Safari/` and names no other browser or in-app browser. In-app WebViews (GroupMe, Instagram) usually leave out `Safari/`, so unknown iOS browsers become `ios-other`. That is the safer default, because the deep link plus fallback still works there.

### `openVenmoWithFallback(appUrl: string, fallbackUrl: string, timeoutMs = 2000): void`

Navigates the current tab to `appUrl`, then to `fallbackUrl` after `timeoutMs` unless the app takes over first. It returns nothing.

- **Signal that the app opened:** the page fires `blur`, `pagehide`, or `visibilitychange` to `hidden`. Any of these cancels the fallback. On iOS, the "Open in Venmo?" prompt also blurs the page, so a buyer who reads the prompt slowly doesn't get bounced to venmo.com.
- **Cleanup:** all listeners and the timer are removed after the first of: an app signal, or the fallback firing. Nothing leaks between taps, and tapping again starts a fresh attempt.
- **Browser only:** it uses `window` and `document`, so call it from an event handler, never during render or on the server.

## Edge cases

- **Venmo not installed:** iOS shows nothing for an unknown `venmo://` scheme (some browsers show an error), and the 2s fallback opens venmo.com with the same fields. Android Chrome handles this itself through `browser_fallback_url`.
- **Buyer dismisses the "Open in Venmo?" prompt:** the blur already cancelled the fallback, so the page stays put. The buyer can tap again, use Copy Link, or use the manual details under "Link not working?".
- **Why not use `venmo://` in Safari too:** Safari shows "address is invalid" when the app is missing, and the universal link already works there.
- **Why the web link fails in Chrome:** iOS only hands universal links to apps from Safari. Chrome and in-app browsers load venmo.com as a normal page. Android only opens verified app links reliably from some contexts, and an `intent://` URL is explicit.
- **Amount or username changes after render:** the URLs are rebuilt on every render from props, so they are never stale.

## Testing

- `cd frontend && pnpm test` runs `venmo.test.ts` (Vitest, also in CI). It covers each URL format, encoding, platform detection for 10 real user agents, and every fallback path with fake timers.
- On a real device, the app handoff can only be checked by hand. Check Chrome iOS, Safari iOS, Chrome Android, and the Instagram and GroupMe in-app browsers (send yourself the link). Confirm the amount and note are filled in, then close Venmo without paying. Repeat with Venmo uninstalled to check the fallback.

## Changing this module

- **New in-app browser opening the wrong link:** add its user agent token to the `isOtherBrowser` regex in `detectVenmoPlatform`, and add a case to the `detectVenmoPlatform` table in the tests.
- **Venmo changes its URL format:** update only the builders in `venmo.ts`. The button and the order page don't build URLs themselves.
