import { Router } from "express";
import {
  completeOrderPickupHandler,
  confirmOrderPaymentHandler,
  createOrderHandler,
  getOrderHandler,
  sendPaymentRemindersHandler,
  undoOrderPickupHandler,
} from "./order.handlers";
import validate from "../../middleware/validate";
import { OrderRouteParams } from "./order.types";
import { CreateOrderBody } from "common";
import { authenticate } from "../../middleware/authenticate";
import {
  asyncHandler,
  handlePrismaErrors,
} from "../../middleware/handlePrismaErrors";

const orderRouter = Router();

orderRouter.get(
  "/:id",
  validate({ params: OrderRouteParams }),
  authenticate,
  asyncHandler(getOrderHandler),
);

orderRouter.post(
  "/create",
  validate({ body: CreateOrderBody }),
  authenticate,
  asyncHandler(createOrderHandler),
);

orderRouter.post(
  "/:id/complete-pickup",
  validate({ params: OrderRouteParams }),
  authenticate,
  asyncHandler(completeOrderPickupHandler),
);

orderRouter.post(
  "/:id/undo-pickup",
  validate({ params: OrderRouteParams }),
  authenticate,
  asyncHandler(undoOrderPickupHandler),
);

orderRouter.post(
  "/:id/confirm-payment",
  validate({ params: OrderRouteParams }),
  authenticate,
  asyncHandler(confirmOrderPaymentHandler),
);

orderRouter.post(
  "/cron/payment-reminders",
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_KEY}`) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    next();
  },
  asyncHandler(sendPaymentRemindersHandler),
);

orderRouter.use(handlePrismaErrors);

export default orderRouter;
