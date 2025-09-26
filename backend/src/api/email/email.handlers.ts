import { Request, Response } from "express-serve-static-core";
import { MailgunInboundEmailBody } from "./email.types";
import {
  parseUnverifiedVenmoEmail,
  updateOrderPaymentStatus,
} from "./email.services";
import { isValidVenmoEmail } from "../../utils/email";
import { z } from "zod";

export const parseEmailHandler = async (
  req: Request<{}, any, z.infer<typeof MailgunInboundEmailBody>, {}>,
  res: Response
) => {
  try {
    const bodyHtml = req.body["body-html"];
    const bodyPlain = req.body["Body-plain"];
    const { from, subject } = req.body;

    // Verify email is from Venmo
    const isFromVenmo = isValidVenmoEmail(from);
    if (!isFromVenmo) {
      res.status(400).json({
        message: "Email not from verified Venmo address",
      });
      return;
    }

    // Use HTML body if available, otherwise use plain text
    const emailContent = bodyHtml || bodyPlain;

    // Parse email to extract amount and order ID
    const { parsedAmount, orderId } = parseUnverifiedVenmoEmail(emailContent);

    // Update order payment status in database
    const updatedOrder = await updateOrderPaymentStatus(orderId, parsedAmount);

    res.status(200).json({
      message: "Email parsed and order updated successfully",
      data: {
        amount: parsedAmount,
        orderId,
        orderStatus: updatedOrder.paymentStatus,
        verified: isFromVenmo,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
