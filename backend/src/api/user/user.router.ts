import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import validate from "../../middleware/validate";
import { UserRouteParams } from "./user.types";
import { UpdateUserBody } from "common";
import {
  getUserHandler,
  getUserOrdersHandler,
  getUserOrganizationsHandler,
  updateUserHandler,
} from "./user.handlers";

const userRouter = Router();

userRouter.get("/:id", validate({ params: UserRouteParams }), getUserHandler);

userRouter.get(
  "/:id/orders",
  validate({ params: UserRouteParams }),
  authenticate,
  getUserOrdersHandler
);

userRouter.get(
  "/:id/organizations",
  validate({ params: UserRouteParams }),
  authenticate,
  getUserOrganizationsHandler
);

userRouter.post(
  "/:id",
  validate({ params: UserRouteParams, body: UpdateUserBody }),
  authenticate,
  updateUserHandler
);

export default userRouter;
