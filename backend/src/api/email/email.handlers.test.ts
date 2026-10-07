import crypto from "crypto";
import { verifyMailgunSignature, verifyDkim } from "./email.handlers";

const SIGNING_KEY = "test-signing-key";

function computeSignature(
  timestamp: number,
  token: string,
  key: string = SIGNING_KEY,
): string {
  return crypto
    .createHmac("sha256", key)
    .update(timestamp + token)
    .digest("hex");
}

describe("verifyMailgunSignature", () => {
  const originalKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

  beforeEach(() => {
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY;
  });

  afterAll(() => {
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = originalKey;
  });

  const timestamp = 1700000000;
  const token = "a-token-from-mailgun";

  it("accepts a correctly computed signature", () => {
    const signature = computeSignature(timestamp, token);
    expect(verifyMailgunSignature(timestamp, token, signature)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const signature = computeSignature(timestamp, token);
    const tampered = signature.slice(0, -1) + (signature.at(-1) === "0" ? "1" : "0");
    expect(verifyMailgunSignature(timestamp, token, tampered)).toBe(false);
  });

  it("rejects when the token doesn't match what was signed", () => {
    const signature = computeSignature(timestamp, token);
    expect(verifyMailgunSignature(timestamp, "different-token", signature)).toBe(
      false,
    );
  });

  it("rejects when the timestamp doesn't match what was signed", () => {
    const signature = computeSignature(timestamp, token);
    expect(verifyMailgunSignature(timestamp + 1, token, signature)).toBe(false);
  });

  it("rejects a signature computed with the wrong signing key", () => {
    const signature = computeSignature(timestamp, token, "wrong-key");
    expect(verifyMailgunSignature(timestamp, token, signature)).toBe(false);
  });

  it("rejects a signature of the wrong length instead of throwing", () => {
    expect(() =>
      verifyMailgunSignature(timestamp, token, "deadbeef"),
    ).not.toThrow();
    expect(verifyMailgunSignature(timestamp, token, "deadbeef")).toBe(false);
  });

  it("rejects a signature that isn't valid hex instead of throwing", () => {
    const notHex = "z".repeat(64);
    expect(() => verifyMailgunSignature(timestamp, token, notHex)).not.toThrow();
    expect(verifyMailgunSignature(timestamp, token, notHex)).toBe(false);
  });

  it("rejects everything when the signing key is not configured", () => {
    delete process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    const signature = computeSignature(timestamp, token);
    expect(verifyMailgunSignature(timestamp, token, signature)).toBe(false);
  });
});

describe("verifyDkim", () => {
  function headersJson(headers: [string, string][]): string {
    return JSON.stringify(headers);
  }

  const passingHeaders: [string, string][] = [
    ["X-Mailgun-Dkim-Check-Result", "Pass"],
    ["Dkim-Signature", "v=1; a=rsa-sha256; d=venmo.com; s=selector;"],
  ];

  it("accepts a passing DKIM check signed by venmo.com", () => {
    expect(verifyDkim(headersJson(passingHeaders))).toBe(true);
  });

  it("is case-insensitive on header name, check result, and domain value", () => {
    // DKIM tag names (e.g. "d=") are always lowercase per RFC 6376, but the
    // header name casing and the check result/domain values are not
    const headers: [string, string][] = [
      ["x-mailgun-dkim-check-result", "PASS"],
      ["dkim-signature", "v=1; a=rsa-sha256; d=VENMO.COM; s=selector;"],
    ];
    expect(verifyDkim(headersJson(headers))).toBe(true);
  });

  it("rejects when message-headers is undefined", () => {
    expect(verifyDkim(undefined)).toBe(false);
  });

  it("rejects malformed JSON instead of throwing", () => {
    expect(() => verifyDkim("not json")).not.toThrow();
    expect(verifyDkim("not json")).toBe(false);
  });

  it("rejects when the DKIM check result header is missing", () => {
    const headers: [string, string][] = [
      ["Dkim-Signature", "v=1; a=rsa-sha256; d=venmo.com; s=selector;"],
    ];
    expect(verifyDkim(headersJson(headers))).toBe(false);
  });

  it("rejects when the DKIM check result is fail", () => {
    const headers: [string, string][] = [
      ["X-Mailgun-Dkim-Check-Result", "Fail"],
      ["Dkim-Signature", "v=1; a=rsa-sha256; d=venmo.com; s=selector;"],
    ];
    expect(verifyDkim(headersJson(headers))).toBe(false);
  });

  it("rejects when the DKIM-Signature header is missing", () => {
    const headers: [string, string][] = [
      ["X-Mailgun-Dkim-Check-Result", "Pass"],
    ];
    expect(verifyDkim(headersJson(headers))).toBe(false);
  });

  it("rejects when the DKIM signature domain is not venmo.com", () => {
    const headers: [string, string][] = [
      ["X-Mailgun-Dkim-Check-Result", "Pass"],
      ["Dkim-Signature", "v=1; a=rsa-sha256; d=attacker.com; s=selector;"],
    ];
    expect(verifyDkim(headersJson(headers))).toBe(false);
  });
});
