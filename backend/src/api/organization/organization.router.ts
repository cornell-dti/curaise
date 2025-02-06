import { Router } from "express";
import validate from "../../middleware/validate";
import {
  OrganizationRouteParams,
  CreateOrganizationBody,
} from "./organization.types";
import {
  getOrganizationFundraisersHandler,
  getOrganizationHandler,
  createOrganizationHandler,
} from "./organization.handlers";
import { authenticate } from "../../middleware/authenticate";

const organizationRouter = Router();

organizationRouter.get(
  "/:id",
  validate({ params: OrganizationRouteParams }),
  getOrganizationHandler
);

organizationRouter.get(
  "/:id/fundraisers",
  validate({ params: OrganizationRouteParams }),
  getOrganizationFundraisersHandler
);

organizationRouter.post("/:id/add-admin");

organizationRouter.post(
  "/create",
  validate({ body: CreateOrganizationBody }),
  authenticate,
  createOrganizationHandler
);

organizationRouter.post("/:id/update");

export default organizationRouter;
