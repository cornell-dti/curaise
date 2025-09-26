import * as cheerio from "cheerio";
import { decode, encode } from "quoted-printable";

export const parseUnverifiedVenmoEmail = (raw: string) => {
  // decode quoted-printable if present
  const htmlString = /=\r?\n|=3D|=20|=[A-F0-9]{2}/i.test(raw)
    ? decode(raw)
    : raw;

  let parsedAmount: number | null = null;
  let orderId: string | null = null;

  const $ = cheerio.load(htmlString);
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
