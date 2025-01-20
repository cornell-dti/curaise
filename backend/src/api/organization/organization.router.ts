import { Router } from "express";
import validate from "../../middleware/validate";
import { OrganizationRouteParams } from "./organization.types";
import {
  getOrganizationFundraisersHandler,
  getOrganizationHandler,
} from "./organization.handlers";

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

organizationRouter.post("/create");

organizationRouter.post("/:id/update");

export default organizationRouter;
