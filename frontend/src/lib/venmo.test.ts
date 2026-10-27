import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_OPEN_TIMEOUT_MS,
  detectVenmoPlatform,
  openVenmoWithFallback,
  venmoAndroidIntentUrl,
  venmoAppUrl,
  venmoWebUrl,
  type VenmoPlatform,
} from "./venmo";

const payment = {
  username: "cu-raise",
  amount: "6.00",
  note: "8363ff94-7e3b-4ccf-8d07-472fdbdf54be",
};

describe("Venmo URLs", () => {
  it("builds the web link", () => {
    expect(venmoWebUrl(payment)).toBe(
      "https://venmo.com/cu-raise?txn=pay&note=8363ff94-7e3b-4ccf-8d07-472fdbdf54be&amount=6.00",
    );
  });

  it("builds the app deep link", () => {
    expect(venmoAppUrl(payment)).toBe(
      "venmo://paycharge?txn=pay&recipients=cu-raise&amount=6.00&note=8363ff94-7e3b-4ccf-8d07-472fdbdf54be",
    );
  });

  it("builds an Android intent with the encoded web link as fallback", () => {
    const url = venmoAndroidIntentUrl(payment);
    expect(url).toMatch(/^intent:\/\/paycharge\?txn=pay&recipients=cu-raise&/);
    expect(url).toContain("#Intent;scheme=venmo;package=com.venmo;");
    const fallback = url.match(/S\.browser_fallback_url=([^;]+);end$/)![1];
    expect(decodeURIComponent(fallback)).toBe(venmoWebUrl(payment));
  });

  it("encodes characters that would break the query string", () => {
    const url = venmoAppUrl({ username: "a b", amount: "1", note: "x&y=z #1" });
    expect(url).toContain("recipients=a%20b");
    expect(url).toContain("note=x%26y%3Dz%20%231");
  });
});

describe("detectVenmoPlatform", () => {
  const iOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";
  const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
  const cases: [string, string, number, VenmoPlatform][] = [
    ["Safari iOS", `${iOS} Version/17.5 Mobile/15E148 Safari/604.1`, 5, "ios-safari"],
    ["Chrome iOS", `${iOS} CriOS/126.0 Mobile/15E148 Safari/604.1`, 5, "ios-other"],
    ["Firefox iOS", `${iOS} FxiOS/127.0 Mobile/15E148 Safari/605.1.15`, 5, "ios-other"],
    ["Instagram iOS", `${iOS} Mobile/15E148 Instagram 334.0.4.32.98`, 5, "ios-other"],
    ["Facebook iOS", `${iOS} Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]`, 5, "ios-other"],
    ["WKWebView (GroupMe)", `${iOS} Mobile/15E148`, 5, "ios-other"],
    ["iPadOS Safari", mac, 5, "ios-safari"],
    ["Desktop Safari", mac, 0, "desktop"],
    ["Chrome Android", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36", 5, "android"],
    ["Desktop Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", 0, "desktop"],
  ];

  it.each(cases)("%s -> %s", (_, ua, touchPoints, expected) => {
    expect(detectVenmoPlatform(ua, touchPoints)).toBe(expected);
  });
});

describe("openVenmoWithFallback", () => {
  let win: EventTarget & {
    location: { href: string };
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
  };
  let doc: EventTarget & { visibilityState: DocumentVisibilityState };

  beforeEach(() => {
    vi.useFakeTimers();
    win = Object.assign(new EventTarget(), {
      location: { href: "http://localhost/order" },
      setTimeout: ((fn: () => void, ms: number) => setTimeout(fn, ms)) as typeof setTimeout,
      clearTimeout: ((id: number) => clearTimeout(id)) as typeof clearTimeout,
    });
    doc = Object.assign(new EventTarget(), { visibilityState: "visible" as const });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("navigates to the app link right away", () => {
    openVenmoWithFallback("venmo://app", "https://venmo.com/web");
    expect(win.location.href).toBe("venmo://app");
  });

  it("falls back to the web link when the page stays in the foreground", () => {
    openVenmoWithFallback("venmo://app", "https://venmo.com/web");
    vi.advanceTimersByTime(APP_OPEN_TIMEOUT_MS - 1);
    expect(win.location.href).toBe("venmo://app");
    vi.advanceTimersByTime(1);
    expect(win.location.href).toBe("https://venmo.com/web");
  });

  it.each(["blur", "pagehide"])("does not fall back after %s", (event) => {
    openVenmoWithFallback("venmo://app", "https://venmo.com/web");
    win.dispatchEvent(new Event(event));
    vi.advanceTimersByTime(APP_OPEN_TIMEOUT_MS);
    expect(win.location.href).toBe("venmo://app");
  });

  it("does not fall back once the page is hidden", () => {
    openVenmoWithFallback("venmo://app", "https://venmo.com/web");
    doc.visibilityState = "hidden";
    doc.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(APP_OPEN_TIMEOUT_MS);
    expect(win.location.href).toBe("venmo://app");
  });

  it("ignores visibilitychange while the page is still visible", () => {
    openVenmoWithFallback("venmo://app", "https://venmo.com/web");
    doc.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(APP_OPEN_TIMEOUT_MS);
    expect(win.location.href).toBe("https://venmo.com/web");
  });

  it("removes its listeners after falling back", () => {
    const removeWin = vi.spyOn(win, "removeEventListener");
    const removeDoc = vi.spyOn(doc, "removeEventListener");
    openVenmoWithFallback("venmo://app", "https://venmo.com/web", 500);
    vi.advanceTimersByTime(500);
    expect(removeWin.mock.calls.map(([type]) => type).sort()).toEqual(["blur", "pagehide"]);
    expect(removeDoc.mock.calls.map(([type]) => type)).toEqual(["visibilitychange"]);
  });
});
