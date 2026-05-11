import crypto from "crypto";
import { Request, Response } from "express-serve-static-core";
import { load } from "cheerio";
import { Decimal } from "decimal.js";
import { MailgunInboundEmailBody } from "./email.types";
import {
  parseUnverifiedVenmoEmail,
  parseVerifiedVenmoEmail,
  updateOrderPaymentStatus,
} from "./email.services";

function verifyMailgunSignature(
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
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function verifyDkim(messageHeaders: string): boolean {
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

    // Verify the DKIM signature domain is venmo.com
    const dkimSig = headers.find(
      ([name]) => name.toLowerCase() === "dkim-signature",
    );
    if (!dkimSig) {
      console.error("No DKIM-Signature header found");
      return false;
    }
    const domainMatch = dkimSig[1].match(/\bd=([^;\s]+)/);
    if (!domainMatch || domainMatch[1].toLowerCase() !== "venmo.com") {
      console.error("DKIM signature domain is not venmo.com:", domainMatch?.[1]);
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
      timestamp,
      token,
      signature,
    } = req.body;

    if (!verifyMailgunSignature(timestamp, token, signature)) {
      res.status(401).json({ message: "invalid signature" });
      return;
    }

    // Verify the email was actually signed by Venmo (DKIM)
    if (!verifyDkim(messageHeaders)) {
      res.status(401).json({ message: "DKIM verification failed" });
      return;
    }

    // Confirm sender is Venmo
    if (from !== "Venmo <venmo@venmo.com>") {
      res.status(406).json({ message: "ignored sender" });
      return;
    }

    // Choose content
    const emailContent = bodyHtml || bodyPlain || "";
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
