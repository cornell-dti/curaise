import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorizeAdmin } from "../../middleware/authorizeAdmin";
import validate from "../../middleware/validate";
import { UpdateOrganizationAuthorizedBody } from "common";
import {
  verifyAdminHandler,
  getAllOrganizationsHandler,
  updateOrganizationAuthorizedHandler,
} from "./admin.handlers";
import {
  asyncHandler,
  handlePrismaErrors,
} from "../../middleware/handlePrismaErrors";
import { z } from "zod";

const adminRouter = Router();

const OrganizationParams = z.object({
  id: z.string().uuid(),
});

adminRouter.get(
  "/verify",
  authenticate,
  authorizeAdmin,
  asyncHandler(verifyAdminHandler),
);

adminRouter.get(
  "/organizations",
  authenticate,
  authorizeAdmin,
  asyncHandler(getAllOrganizationsHandler),
);

adminRouter.post(
  "/organizations/:id/authorize",
  authenticate,
  authorizeAdmin,
  validate({ params: OrganizationParams, body: UpdateOrganizationAuthorizedBody }),
  asyncHandler(updateOrganizationAuthorizedHandler),
);

adminRouter.use(handlePrismaErrors);

export default adminRouter;
