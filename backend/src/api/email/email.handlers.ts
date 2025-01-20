import { Request, Response } from "express-serve-static-core";
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
