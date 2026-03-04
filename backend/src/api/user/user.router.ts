import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import validate from "../../middleware/validate";
import { UserRouteParams, UserSearchQueryParams } from "./user.types";
import { UpdateUserBody } from "common";
import {
  getUserHandler,
  getUserOrdersHandler,
  getUserOrganizationsHandler,
  updateUserHandler,
  findUserByEmailHandler,
} from "./user.handlers";
import {
  asyncHandler,
  handlePrismaErrors,
} from "../../middleware/handlePrismaErrors";

const userRouter = Router();

userRouter.get(
  "/search",
  validate({ query: UserSearchQueryParams }),
  asyncHandler(findUserByEmailHandler)
);

userRouter.get(
  "/:id",
  validate({ params: UserRouteParams }),
  asyncHandler(getUserHandler)
);

userRouter.get(
  "/:id/orders",
  validate({ params: UserRouteParams }),
  authenticate,
  asyncHandler(getUserOrdersHandler)
);

userRouter.get(
  "/:id/organizations",
  validate({ params: UserRouteParams }),
  authenticate,
  asyncHandler(getUserOrganizationsHandler)
);

userRouter.post(
  "/:id",
  validate({ params: UserRouteParams, body: UpdateUserBody }),
  authenticate,
  asyncHandler(updateUserHandler)
);

userRouter.use(handlePrismaErrors);

export default userRouter;