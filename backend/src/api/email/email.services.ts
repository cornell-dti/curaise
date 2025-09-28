import { load } from "cheerio";

export const parseVerifiedVenmoEmail = (raw: string) => {
  // Load HTML into Cheerio
  const $ = load(raw);

  // Extract data
  const dollarAmount = $('div.amount-container__amount-text').text().trim() || '0'; // "5"
  const centAmount = $('div.amount-container__text-high').eq(1).text().trim() || '00'; // "01"
  const transactionNote = $('p.transaction-note').text().trim() || 'NO NOTE'; // "4a1s"

  // Convert to integers
  const dollarAmountInt = parseInt(dollarAmount, 10);
  const centAmountInt = parseInt(centAmount, 10);

  // Convert to float for total amount
  const floatAmount = dollarAmountInt + centAmountInt / 100;

  console.log('Dollar Amount:', `"${dollarAmountInt}"`);
  console.log('Cent Amount:', `"${centAmountInt}"`);
  console.log('Total Amount:', `$${floatAmount.toFixed(2)}`);
  console.log('Transaction Note:', `"${transactionNote}"`);

  // Validate parsed amount
  if (isNaN(floatAmount)) {
    throw new Error("Failed to parse payment amount");
  }

  return { parsedAmount: floatAmount, orderId: transactionNote };
};
