import { Router } from "express";
import validate from "../../middleware/validate";
import { OrganizationRouteParams } from "./organization.types";
import { CreateOrganizationBody, UpdateOrganizationBody } from "common";
import {
  getOrganizationFundraisersHandler,
  getOrganizationHandler,
  createOrganizationHandler,
  updateOrganizationHandler,
} from "./organization.handlers";
import {
  authenticate,
  authenticateOptional,
} from "../../middleware/authenticate";
import {
  asyncHandler,
  handlePrismaErrors,
} from "../../middleware/handlePrismaErrors";

const organizationRouter = Router();

organizationRouter.get(
  "/:id",
  validate({ params: OrganizationRouteParams }),
  asyncHandler(getOrganizationHandler)
);

organizationRouter.get(
  "/:id/fundraisers",
  validate({ params: OrganizationRouteParams }),
  authenticateOptional,
  asyncHandler(getOrganizationFundraisersHandler)
);

organizationRouter.post(
  "/create",
  validate({ body: CreateOrganizationBody }),
  authenticate,
  asyncHandler(createOrganizationHandler)
);

organizationRouter.post(
  "/:id/update",
  validate({ params: OrganizationRouteParams, body: UpdateOrganizationBody }),
  authenticate,
  asyncHandler(updateOrganizationHandler)
);

organizationRouter.use(handlePrismaErrors);

export default organizationRouter;