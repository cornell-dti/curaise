import { Router } from "express";
import emailRouter from "./api/email";
import fundraiserRouter from "./api/fundraiser";
import orderRouter from "./api/order";
import organizationRouter from "./api/organization";
import userRouter from "./api/user";

const router = Router();

router.get("/api/", (_, res) => {
  res.status(200).json({ message: "Hello, World!" });
});

router.use("/api/email", emailRouter);
router.use("/api/fundraiser", fundraiserRouter);
router.use("/api/order", orderRouter);
router.use("/api/organization", organizationRouter);
router.use("/api/user", userRouter);

export default router;
