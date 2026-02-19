import { Router } from "express";
import {
  completeOrderPickupHandler,
  confirmOrderPaymentHandler,
  createOrderHandler,
  getOrderHandler,
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
  asyncHandler(getOrderHandler)
);

orderRouter.post(
  "/create",
  validate({ body: CreateOrderBody }),
  authenticate,
  asyncHandler(createOrderHandler)
);

orderRouter.post(
  "/:id/complete-pickup",
  validate({ params: OrderRouteParams }),
  authenticate,
  asyncHandler(completeOrderPickupHandler)
);

orderRouter.post(
  "/:id/confirm-payment",
  validate({ params: OrderRouteParams }),
  authenticate,
  asyncHandler(confirmOrderPaymentHandler)
);

orderRouter.use(handlePrismaErrors);

export default orderRouter;