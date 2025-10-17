import { load } from "cheerio";
import { Decimal } from "decimal.js";
import { prisma } from "../../utils/prisma";
import { calculateOrderTotal } from "../order/order.services";

export const parseUnverifiedVenmoEmail = (raw: string) => {
  let parsedAmount: number | null = null;
  let orderId: string | null = null;

  const $ = load(raw);
  const amount = $('span[style="color:#148572;float:right;"]').text().trim();
  parsedAmount = parseFloat(amount.replace("$", "").replace("+", ""));
  if (isNaN(parsedAmount)) {
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

export const updateOrderPaymentStatus = async (
  orderId: string,
  paidAmount: number
) => {
  try {
    // Calculate expected order total
    const expectedAmount = await calculateOrderTotal(orderId);

    // Validate that paid amount matches expected amount (with small tolerance for floating point precision)
    const tolerance = 0.01;
    if (Math.abs(paidAmount - expectedAmount) > tolerance) {
      throw new Error(
        `Payment amount mismatch: expected $${expectedAmount.toFixed(
          2
        )}, received $${paidAmount.toFixed(2)}`
      );
    }

    // Update order with Venmo payment confirmation
    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentMethod: "VENMO",
        paymentStatus: "CONFIRMED",
      },
    });

    return order;
  } catch (error) {
    throw new Error(
      `Failed to update order payment status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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

  return { Decimal: parsedAmount, orderId: transactionNote };
};
