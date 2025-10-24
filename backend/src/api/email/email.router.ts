import { Router } from "express";
import express from "express";
import { parseEmailHandler } from "./email.handlers";
import { MailgunInboundEmailBody } from "./email.types";
import validate from "../../middleware/validate";

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

emailRouter.post(
  "/parse",
  mailgunMiddleware,
  loggingMiddleware,
  validate({ body: MailgunInboundEmailBody }),
  parseEmailHandler
);

export default emailRouter;
