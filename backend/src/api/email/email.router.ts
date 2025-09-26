import { Router } from "express";
import { parseEmailHandler } from "./email.handlers";
import { MailgunInboundEmailBody } from "./email.types";
import validate from "../../middleware/validate";

const emailRouter = Router();

emailRouter.post("/parse", validate({ body: MailgunInboundEmailBody }), parseEmailHandler);

export default emailRouter;
