import { Request, Response } from "express-serve-static-core";
import { load } from "cheerio";
import { Decimal } from "decimal.js";
import { MailgunInboundEmailBody } from "./email.types";
import {
  parseUnverifiedVenmoEmail,
  parseVerifiedVenmoEmail,
  updateOrderPaymentStatus,
} from "./email.services";

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

    // Confirm sender is Venmo
    console.log("From field:", from);

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
