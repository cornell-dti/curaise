import { load } from "cheerio";
import { Decimal } from "decimal.js";
import { sendPaymentMismatchEmail } from "../../utils/email";
import {
  calculateOrderTotal,
  confirmOrderPayment,
  recordOrderPaymentMismatch,
} from "../order/order.services";

export const parseUnverifiedVenmoEmail = (raw: string) => {
  let parsedAmount: Decimal | null = null;
  let orderId: string | null = null;

  const $ = load(raw);
  const amount = $('span[style="color:#148572;float:right;"]').text().trim();
  const amountStr = amount.replace("$", "").replace("+", "");
  parsedAmount = new Decimal(amountStr);

  if (parsedAmount.isNaN()) {
    console.log("Parsed amount is NaN");
    parsedAmount = null;
    throw new Error("Failed to parse payment amount");
  }
  orderId = $('table[role="presentation"] tbody tr div p').text().trim();
  if (!orderId) {
    throw new Error("Failed to parse venmo message for retreiving orderId");
  }

  return { parsedAmount: parsedAmount, orderId: orderId };
};

export const parseVerifiedVenmoEmail = (raw: string) => {
  // Load HTML into Cheerio
  const $ = load(raw);

  // Extract data
  const dollarAmount =
    $("div.amount-container__amount-text").text().trim() || "0"; // "5"
  const centAmount =
    $("div.amount-container__text-high").eq(1).text().trim() || "00"; // "01"
  const transactionNote = $("p.transaction-note").text().trim() || "NO NOTE"; // "4a1s"

  // Convert to integers
  const dollarAmountInt = parseInt(dollarAmount, 10);
  const centAmountInt = parseInt(centAmount, 10);

  // Convert to Decimal.js value
  const parsedAmount = new Decimal(dollarAmountInt).plus(
    new Decimal(centAmountInt).dividedBy(100)
  );

  // Validate parsed amount
  if (isNaN(parsedAmount.toNumber())) {
    throw new Error("Failed to parse payment amount");
  }

  return { parsedAmount, orderId: transactionNote };
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  paidAmount: Decimal
) => {
  // Calculate expected order total
  const expectedAmount = await calculateOrderTotal(orderId);

  // Validate that paid amount matches expected amount using Decimal comparison
  const tolerance = new Decimal(0.01);
  const difference = paidAmount.minus(expectedAmount).abs();

  if (difference.greaterThan(tolerance)) {
    // Record the mismatch and let the buyer know, rather than silently
    // leaving the order PENDING (which would keep sending them payment reminders).
    const order = await recordOrderPaymentMismatch(orderId, paidAmount);

    await sendPaymentMismatchEmail({
      buyer: order.buyer,
      fundraiserName: order.fundraiser.name,
      orderId: order.id,
      expectedAmount,
      paidAmount,
    });

    return order;
  }

  try {
    // Route through confirmOrderPayment so the inventory check and
    // analytics cache refresh that manual confirmation gets also apply here.
    return await confirmOrderPayment(orderId, "VENMO");
  } catch (error) {
    throw new Error(
      `Failed to update order payment status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
