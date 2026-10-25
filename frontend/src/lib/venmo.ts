export interface VenmoPayment {
  username: string;
  amount: string;
  note: string;
}

export type VenmoPlatform = "ios-safari" | "ios-other" | "android" | "desktop";

const paymentQuery = ({ username, amount, note }: VenmoPayment) =>
  `txn=pay&recipients=${encodeURIComponent(username)}&amount=${encodeURIComponent(amount)}&note=${encodeURIComponent(note)}`;

// web link, works everywhere and is a universal link in iOS Safari
export const venmoWebUrl = ({ username, amount, note }: VenmoPayment) =>
  `https://venmo.com/${encodeURIComponent(username)}?txn=pay&note=${encodeURIComponent(note)}&amount=${encodeURIComponent(amount)}`;

// custom scheme deep link, opens the app directly (iOS browsers other than Safari)
export const venmoAppUrl = (payment: VenmoPayment) =>
  `venmo://paycharge?${paymentQuery(payment)}`;

// Android intent link, Chrome falls back to the web link itself when the app is missing
export const venmoAndroidIntentUrl = (payment: VenmoPayment) =>
  `intent://paycharge?${paymentQuery(payment)}#Intent;scheme=venmo;package=com.venmo;S.browser_fallback_url=${encodeURIComponent(venmoWebUrl(payment))};end`;

export function detectVenmoPlatform(
  userAgent: string,
  maxTouchPoints = 0,
): VenmoPlatform {
  if (/Android/i.test(userAgent)) return "android";

  // iPadOS reports a desktop Mac user agent, so use touch support to tell them apart
  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  if (!isIOS) return "desktop";

  // Safari hands venmo.com off to the app as a universal link. Chrome, other
  // browsers and in-app browsers (Instagram, GroupMe, ...) do not, and their
  // user agents either name the browser or omit the "Safari/" token.
  const isOtherBrowser =
    /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|Brave|YaBrowser/i.test(
      userAgent,
    ) || /Instagram|FBAN|FBAV|GroupMe|Line\/|Snapchat|Twitter/i.test(userAgent);
  const isSafari = /Safari\//.test(userAgent) && !isOtherBrowser;
  return isSafari ? "ios-safari" : "ios-other";
}
