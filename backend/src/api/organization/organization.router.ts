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

const organizationRouter = Router();

organizationRouter.get(
  "/:id",
  validate({ params: OrganizationRouteParams }),
  getOrganizationHandler
);

organizationRouter.get(
  "/:id/fundraisers",
  validate({ params: OrganizationRouteParams }),
  authenticateOptional,
  getOrganizationFundraisersHandler
);

organizationRouter.post(
  "/create",
  validate({ body: CreateOrganizationBody }),
  authenticate,
  createOrganizationHandler
);

organizationRouter.post(
  "/:id/update",
  validate({ params: OrganizationRouteParams, body: UpdateOrganizationBody }),
  authenticate,
  updateOrganizationHandler
);

export default organizationRouter;
