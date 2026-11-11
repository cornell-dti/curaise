import { Router } from "express";
import express from "express";
import { parseEmailHandler } from "./email.handlers";
import { MailgunInboundEmailBody } from "./email.types";
import validate from "../../middleware/validate";
import {
  asyncHandler,
  handlePrismaErrors,
} from "../../middleware/handlePrismaErrors";

const emailRouter = Router();

// Mailgun sends form-urlencoded data
const mailgunMiddleware = express.urlencoded({ extended: true, limit: "5mb" });

// Debug logging middleware
const loggingMiddleware = (req: any, _res: any, next: any) => {
  console.log("=== Incoming Mailgun POST ===");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Keys:", Object.keys(req.body));
  console.log(
    "Body Preview:",
    JSON.stringify(req.body, null, 2).slice(0, 1000)
  );
  console.log("=============================");
  next();
};

// "/parse-mime" is the same handler. Mailgun decides the payload format from
// the forward URL: a URL ending in "mime" gets the raw message in body-mime,
// which is what lets us verify Venmo's DKIM signature ourselves.
emailRouter.post(
  ["/parse", "/parse-mime"],
  mailgunMiddleware,
  loggingMiddleware,
  validate({ body: MailgunInboundEmailBody }),
  asyncHandler(parseEmailHandler),
);

emailRouter.use(handlePrismaErrors);

export default emailRouter;
