import { load } from "cheerio";
import qp from "quoted-printable";

export const parseUnverifiedVenmoEmail = (raw: string) => {
  // decode quoted-printable if present
  const htmlString = /=\r?\n|=3D|=20|=[A-F0-9]{2}/i.test(raw)
    ? qp.decode(raw)
    : raw;

  let parsedAmount: number | null = null;
  let orderId: string | null = null;

  const $ = load(htmlString);
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
import { Decimal } from "decimal.js";

export const parseVerifiedVenmoEmail = (raw: string) => {
    // Load HTML into Cheerio
    const $ = load(raw);

    // Extract data
    const dollarAmount = $("div.amount-container__amount-text").text().trim() || "0"; // "5"
    const centAmount = $("div.amount-container__text-high").eq(1).text().trim() || "00"; // "01"
    const transactionNote = $("p.transaction-note").text().trim() || "NO NOTE"; // "4a1s"

    // Convert to integers
    const dollarAmountInt = parseInt(dollarAmount, 10);
    const centAmountInt = parseInt(centAmount, 10);

    // Convert to Decimal.js value
    const parsedAmount = new Decimal(dollarAmountInt).plus(new Decimal(centAmountInt).dividedBy(100));

    // Validate parsed amount
    if (isNaN(parsedAmount.toNumber())) {
        throw new Error("Failed to parse payment amount");
    }

    return {Decimal: parsedAmount, orderId: transactionNote };
};
