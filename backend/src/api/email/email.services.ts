import { load } from "cheerio";
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