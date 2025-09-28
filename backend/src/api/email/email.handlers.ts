import { Request, Response } from "express-serve-static-core";
import * as cheerio from "cheerio";
import { PostmarkInboundEmailBody } from "./email.types";


export const parseEmailHandler = async (
  req: Request<{}, any, PostmarkInboundEmailBody, {}>,
  res: Response
) => {
  // https://postmarkapp.com/developer/user-guide/inbound/parse-an-email

  // parse email HtmlBody
  req.body.HtmlBody;

  // verify email

  // save email transaction to database

  res.status(200).json({ message: "Email parsed" });
};

export const parseVerifiedVenmoAccountEmailHandler = async (
  req: Request<{}, any, PostmarkInboundEmailBody, {}>,
  res: Response
) => {
  // parse email HtmlBody
  const $ = cheerio.load(req.body.HtmlBody);
  
  
  
};