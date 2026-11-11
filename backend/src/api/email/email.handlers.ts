import crypto from "crypto";
import { Request, Response } from "express-serve-static-core";
import { load } from "cheerio";
import { Decimal } from "decimal.js";
import { MailgunInboundEmailBody } from "./email.types";
import { extractEmailContent, verifyVenmoDkim } from "./email.dkim";
import {
  parseUnverifiedVenmoEmail,
  parseVerifiedVenmoEmail,
  updateOrderPaymentStatus,
} from "./email.services";

/**
 * Verifies this webhook POST was sent by Mailgun, not forged. Without this,
 * anyone could POST straight to /parse and mark any order as paid.
 */
export function verifyMailgunSignature(
  timestamp: number,
  token: string,
  signature: string,
): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.error("MAILGUN_WEBHOOK_SIGNING_KEY is not set");
    return false;
  }

  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(timestamp + token);
  const digest = hmac.digest("hex");

  const digestBuffer = Buffer.from(digest, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

/**
 * Verifies the email was cryptographically signed by venmo.com
 * (Mailgun signature above only proves Mailgun sent the webhook, not that the email
 * it forwarded really came from Venmo).
 *
 * Legacy path for webhooks without a raw MIME body: it relies on Mailgun's
 * X-Mailgun-Dkim-Check-Result header, which Mailgun only adds when its spam
 * filter runs. Webhooks that carry body-mime use verifyVenmoDkim instead.
 */
export function verifyDkim(messageHeaders: string | undefined): boolean {
  if (!messageHeaders) {
    console.error("No message-headers present to verify DKIM");
    return false;
  }

  try {
    const headers: [string, string][] = JSON.parse(messageHeaders);

    // Check that Mailgun's DKIM verification passed
    const dkimResult = headers.find(
      ([name]) => name.toLowerCase() === "x-mailgun-dkim-check-result",
    );
    if (!dkimResult || dkimResult[1].toLowerCase() !== "pass") {
      console.error("DKIM check did not pass:", dkimResult?.[1]);
      return false;
    }

    // Verify every DKIM-Signature header is for venmo.com.
    const dkimSigs = headers.filter(
      ([name]) => name.toLowerCase() === "dkim-signature",
    );
    if (dkimSigs.length === 0) {
      console.error("No DKIM-Signature header found");
      return false;
    }
    const domains = dkimSigs.map(([, value]) => value.match(/\bd=([^;\s]+)/)?.[1]);
    if (domains.some((domain) => domain?.toLowerCase() !== "venmo.com")) {
      console.error("DKIM signature domain is not venmo.com:", domains);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to parse message-headers for DKIM check:", err);
    return false;
  }
}

export const parseEmailHandler = async (
  req: Request<{}, any, MailgunInboundEmailBody, {}>,
  res: Response,
) => {
  try {
    const {
      from,
      subject,
      "body-html": bodyHtml,
      "body-plain": bodyPlain,
      "message-headers": messageHeaders,
      "body-mime": bodyMime,
      timestamp,
      token,
      signature,
    } = req.body;

    // Verify the request actually came from Mailgun
    if (!verifyMailgunSignature(timestamp, token, signature)) {
      res.status(401).json({ message: "invalid signature" });
      return;
    }

    // Cheap filter first so unrelated mail to the catch-all route is dropped
    // without any DKIM work. The From header is attacker-controlled and is
    // not what proves the sender is Venmo (DKIM below does).
    if (from !== "Venmo <venmo@venmo.com>") {
      res.status(406).json({ message: "ignored sender" });
      return;
    }

    // Verify the email was actually signed by Venmo (DKIM), and choose content
    let emailContent: string;
    if (bodyMime) {
      // Raw MIME webhook: check Venmo's signature ourselves
      if (!(await verifyVenmoDkim(bodyMime))) {
        res.status(406).json({ message: "DKIM verification failed" });
        return;
      }
      emailContent = await extractEmailContent(bodyMime);
    } else {
      if (!verifyDkim(messageHeaders)) {
        res.status(406).json({ message: "DKIM verification failed" });
        return;
      }
      emailContent = bodyHtml || bodyPlain || "";
    }

    if (!emailContent) {
      // Nothing to parse; treat as processed to avoid retry storms
      res.status(200).json({ message: "no content" });
      return;
    }

    // Detect format
    let isVerifiedFormat = false;
    try {
      const $ = load(emailContent);
      isVerifiedFormat =
        $("div.amount-container__amount-text").length > 0 ||
        $("div.amount-container__text-high").length > 0;
    } catch {
      isVerifiedFormat = false;
    }

    // Parse
    let parsedAmount: Decimal;
    let orderId: string;
    try {
      if (isVerifiedFormat) {
        const result = parseVerifiedVenmoEmail(emailContent);
        parsedAmount = result.parsedAmount;
        orderId = result.orderId;
      } else {
        const result = parseUnverifiedVenmoEmail(emailContent);
        parsedAmount = result.parsedAmount;
        orderId = result.orderId;
      }
      if (!orderId || parsedAmount == null) {
        // Parse failed—do not retry
        res.status(200).json({ message: "parsed incomplete" });
        return;
      }
    } catch (err) {
      console.error("Failed to parse Venmo email:", err, { subject });
      res.status(200).json({ message: "parse error" });
      return;
    }

    // Persist
    try {
      await updateOrderPaymentStatus(orderId, parsedAmount);
    } catch (err) {
      console.error("Failed to update order payment status:", err, { orderId });
      res.status(200).json({ message: "update error" });
      return;
    }

    res.status(200).json({ message: "ok" });
  } catch (err) {
    console.error("Unexpected error in parseEmailHandler:", err);
    res.status(200).json({ message: "handled" });
  }
};
