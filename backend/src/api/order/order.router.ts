import { Router } from "express";
import {
  completeOrderPickupHandler,
  confirmOrderPaymentHandler,
  createOrderHandler,
  getOrderHandler,
} from "./order.handlers";
import validate from "../../middleware/validate";
import { CreateOrderBody, OrderRouteParams } from "./order.types";
import { authenticate } from "../../middleware/authenticate";

const orderRouter = Router();

orderRouter.get(
  "/:id",
  validate({ params: OrderRouteParams }),
  authenticate,
  getOrderHandler
);

orderRouter.post(
  "/create",
  validate({ body: CreateOrderBody }),
  authenticate,
  createOrderHandler
);

orderRouter.post(
  "/:id/complete-pickup",
  validate({ params: OrderRouteParams }),
  authenticate,
  completeOrderPickupHandler
);

orderRouter.post(
  "/:id/confirm-payment",
  validate({ params: OrderRouteParams }),
  authenticate,
  confirmOrderPaymentHandler
);

export default orderRouter;
