import { Router } from "express";
import {
  FundraiserRouteParams,
  FundraiserItemRouteParams,
  DeleteAnnouncementRouteParams,
  PickupEventRouteParams,
  ApproveReferralRouteParams,
} from "./fundraiser.types";
import {
  CreateFundraiserBody,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  CreateAnnouncementBody,
  UpdatePickupEventBody,
  CreatePickupEventBody,
} from "common";
import validate from "../../middleware/validate";
import {
  createFundraiserHandler,
  getAllFundraisersHandler,
  getFundraiserHandler,
  updateFundraiserHandler,
  publishFundraiserHandler,
  getFundraiserItemsHandler,
  getFundraiserOrdersHandler,
  createFundraiserItemHandler,
  updateFundraiserItemHandler,
  deleteFundraiserItemHandler,
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getFundraiserAnalyticsHandler,
  createPickupEventHandler,
  updatePickupEventHandler,
  deletePickupEventHandler,
  createReferralHandler,
  approveReferralHandler,
  deleteReferralHandler,
} from "./fundraiser.handlers";
import { authenticate } from "../../middleware/authenticate";
import {
  asyncHandler,
  handlePrismaErrors,
} from "../../middleware/handlePrismaErrors";

const fundraiserRouter = Router();

fundraiserRouter.get("/", asyncHandler(getAllFundraisersHandler));

fundraiserRouter.get(
  "/:id",
  validate({ params: FundraiserRouteParams }),
  asyncHandler(getFundraiserHandler)
);

fundraiserRouter.get(
  "/:id/items",
  validate({ params: FundraiserRouteParams }),
  asyncHandler(getFundraiserItemsHandler)
);

fundraiserRouter.get(
  "/:id/orders",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  asyncHandler(getFundraiserOrdersHandler)
);

fundraiserRouter.post(
  "/create",
  validate({ body: CreateFundraiserBody }),
  authenticate,
  asyncHandler(createFundraiserHandler)
);

fundraiserRouter.post(
  "/:id/update",
  validate({ params: FundraiserRouteParams, body: UpdateFundraiserBody }),
  authenticate,
  asyncHandler(updateFundraiserHandler)
);

fundraiserRouter.post(
  "/:id/publish",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  asyncHandler(publishFundraiserHandler)
);

fundraiserRouter.post(
  "/:id/pickup-events/create",
  validate({ params: FundraiserRouteParams, body: CreatePickupEventBody }),
  authenticate,
  asyncHandler(createPickupEventHandler)
);

fundraiserRouter.post(
  "/:fundraiserId/pickup-events/:pickupEventId/update",
  validate({ params: PickupEventRouteParams, body: UpdatePickupEventBody }),
  authenticate,
  asyncHandler(updatePickupEventHandler)
);

fundraiserRouter.delete(
  "/:fundraiserId/pickup-events/:pickupEventId/delete",
  validate({ params: PickupEventRouteParams }),
  authenticate,
  asyncHandler(deletePickupEventHandler)
);

fundraiserRouter.post(
  "/:id/items/create",
  validate({ params: FundraiserRouteParams, body: CreateFundraiserItemBody }),
  authenticate,
  asyncHandler(createFundraiserItemHandler)
);

fundraiserRouter.post(
  "/:fundraiserId/items/:itemId/update",
  validate({
    params: FundraiserItemRouteParams,
    body: UpdateFundraiserItemBody,
  }),
  authenticate,
  asyncHandler(updateFundraiserItemHandler)
);

fundraiserRouter.delete(
  "/:fundraiserId/items/:itemId/delete",
  validate({
    params: FundraiserItemRouteParams,
  }),
  authenticate,
  asyncHandler(deleteFundraiserItemHandler)
);

fundraiserRouter.post(
  "/:id/announcements/create",
  validate({ params: FundraiserRouteParams, body: CreateAnnouncementBody }),
  authenticate,
  asyncHandler(createAnnouncementHandler)
);

fundraiserRouter.delete(
  "/:fundraiserid/announcements/:announcementid/delete",
  validate({ params: DeleteAnnouncementRouteParams }),
  authenticate,
  asyncHandler(deleteAnnouncementHandler)
);

fundraiserRouter.get(
  "/:id/analytics",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  asyncHandler(getFundraiserAnalyticsHandler)
);

// Create a referral request
fundraiserRouter.post(
  "/:id/referrals",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  asyncHandler(createReferralHandler)
);

// Approve a referral request (admin only)
fundraiserRouter.post(
  "/:fundraiserId/referrals/:referralId/approve",
  validate({ params: ApproveReferralRouteParams }),
  authenticate,
  asyncHandler(approveReferralHandler)
);

// Delete a referral (admin only)
fundraiserRouter.delete(
  "/:fundraiserId/referrals/:referralId/delete",
  validate({ params: ApproveReferralRouteParams }),
  authenticate,
  asyncHandler(deleteReferralHandler)
);

fundraiserRouter.use(handlePrismaErrors);

export default fundraiserRouter;