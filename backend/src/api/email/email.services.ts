import { prisma } from "../../utils/prisma";
const cheerio = require("cheerio");
const qp = require("quoted-printable");

export const parseUnverifiedVenmoEmail = (raw: string) => {
  // decode quoted-printable if present
  const htmlString = /=\r?\n|=3D|=20|=[A-F0-9]{2}/i.test(raw)
    ? qp.decode(raw)
    : raw;

  const $ = cheerio.load(htmlString);
  const amount = $('span[style="color:#148572;float:right;"]').text().trim();
  const parsedAmount = parseFloat(amount.replace("$", "").replace("+", ""));

  const orderId = $('table[role="presentation"] tbody tr div p').text().trim();

  return { parsedAmount: parsedAmount, orderId: orderId };
};
