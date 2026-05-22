import { Request, Response } from "express-serve-static-core";
import { load } from "cheerio";
import { Decimal } from "decimal.js";
import { MailgunInboundEmailBody } from "./email.types";
import {
  parseUnverifiedVenmoEmail,
  parseVerifiedVenmoEmail,
  updateOrderPaymentStatus,
} from "./email.services";
import { sendEmail } from "../../utils/email";

const ON_CALL_EMAIL = process.env.ON_CALL_EMAIL;

async function forwardToOnCall(options: {
  reason: string;
  subject: string | undefined;
  bodyHtml: string | undefined;
  bodyPlain: string | undefined;
}) {
  if (!ON_CALL_EMAIL) {
    console.warn("ON_CALL_EMAIL not set; skipping on-call forward");
    return;
  }
  try {
    await sendEmail({
      to: ON_CALL_EMAIL,
      subject: `[CURaise] Gmail forwarding auto-confirm ${options.reason}: ${options.subject ?? "(no subject)"}`,
      text: options.bodyPlain,
      html: options.bodyHtml,
    });
  } catch (err) {
    console.error("Failed to forward auto-confirm failure to on-call:", err);
  }
}

type ConfirmResult = "confirmed" | "not-found" | "failed";

async function autoConfirmForwarding(
  bodyHtml: string | undefined,
  bodyPlain: string | undefined
): Promise<ConfirmResult> {
  const confirmUrlPattern = /https:\/\/mail\.google\.com\/mail\/vf-[^\s"<>]+/;

  // Try HTML first
  if (bodyHtml) {
    const $ = load(bodyHtml);
    const links = $("a[href*='mail.google.com/mail/vf-']");
    if (links.length > 0) {
      const url = links.first().attr("href");
      if (url) {
        const response = await fetch(url, { method: "POST" });
        if (!response.ok) {
          console.warn(`Forwarding confirmation POST failed: ${url} (status: ${response.status})`);
          return "failed";
        }
        console.log(`Forwarding confirmed via HTML link: ${url} (status: ${response.status})`);
        return "confirmed";
      }
    }
  }

  // Fall back to plain text regex
  const text = bodyPlain || bodyHtml || "";
  const match = text.match(confirmUrlPattern);
  if (match) {
    const url = match[0];
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      console.warn(`Forwarding confirmation POST failed: ${url} (status: ${response.status})`);
      return "failed";
    }
    console.log(`Forwarding confirmed via text link: ${url} (status: ${response.status})`);
    return "confirmed";
  }

  return "not-found";
}

export const parseEmailHandler = async (
  req: Request<{}, any, MailgunInboundEmailBody, {}>,
  res: Response
) => {
  try {
    const {
      from,
      subject,
      "body-html": bodyHtml,
      "body-plain": bodyPlain,
      timestamp,
      token,
      signature,
    } = req.body;

    // TODO: Verify Mailgun signature

    // Auto-confirm Gmail forwarding requests
    if (from.includes("forwarding-noreply@google.com")) {
      try {
        const result = await autoConfirmForwarding(bodyHtml, bodyPlain);
        if (result === "confirmed") {
          res.status(200).json({ message: "forwarding confirmed" });
        } else if (result === "failed") {
          await forwardToOnCall({ reason: "POST failed", subject, bodyHtml, bodyPlain });
          res.status(200).json({ message: "forwarding confirmation failed" });
        } else {
          console.warn("Gmail forwarding email received but no confirmation URL found");
          await forwardToOnCall({ reason: "no confirmation URL", subject, bodyHtml, bodyPlain });
          res.status(200).json({ message: "no confirmation url found" });
        }
      } catch (err) {
        console.error("Failed to auto-confirm forwarding:", err);
        await forwardToOnCall({ reason: "exception", subject, bodyHtml, bodyPlain });
        res.status(200).json({ message: "forwarding confirmation failed" });
      }
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
