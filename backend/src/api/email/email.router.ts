import { Router } from "express";
import { parseEmailHandler } from "./email.handlers";

const emailRouter = Router();

emailRouter.post("/parse", parseEmailHandler);

export default emailRouter;
