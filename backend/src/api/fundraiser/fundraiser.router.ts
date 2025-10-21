import { Router } from "express";
import {
  FundraiserRouteParams,
  FundraiserItemRouteParams,
  DeleteAnnouncementRouteParams,
  PickupEventRouteParams,
  DeleteFundraiserItemRouteParams,
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
} from "./fundraiser.handlers";
import { authenticate } from "../../middleware/authenticate";

const fundraiserRouter = Router();

fundraiserRouter.get("/", getAllFundraisersHandler);

fundraiserRouter.get(
  "/:id",
  validate({ params: FundraiserRouteParams }),
  getFundraiserHandler
);

fundraiserRouter.get(
  "/:id/items",
  validate({ params: FundraiserRouteParams }),
  getFundraiserItemsHandler
);

fundraiserRouter.get(
  "/:id/orders",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  getFundraiserOrdersHandler
);

fundraiserRouter.post(
  "/create",
  validate({ body: CreateFundraiserBody }),
  authenticate,
  createFundraiserHandler
);

fundraiserRouter.post(
  "/:id/update",
  validate({ params: FundraiserRouteParams, body: UpdateFundraiserBody }),
  authenticate,
  updateFundraiserHandler
);

fundraiserRouter.post(
  "/:id/publish",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  publishFundraiserHandler
);

fundraiserRouter.post(
  "/:id/pickup-events/create",
  validate({ params: FundraiserRouteParams, body: CreatePickupEventBody }),
  authenticate,
  createPickupEventHandler
);

fundraiserRouter.post(
  "/:fundraiserId/pickup-events/:pickupEventId/update",
  validate({ params: PickupEventRouteParams, body: UpdatePickupEventBody }),
  authenticate,
  updatePickupEventHandler
);

fundraiserRouter.delete(
  "/:fundraiserId/pickup-events/:pickupEventId/delete",
  validate({ params: PickupEventRouteParams }),
  authenticate,
  deletePickupEventHandler
);

fundraiserRouter.post(
  "/:id/items/create",
  validate({ params: FundraiserRouteParams, body: CreateFundraiserItemBody }),
  authenticate,
  createFundraiserItemHandler
);

fundraiserRouter.post(
  "/:fundraiserId/items/:itemId/update",
  validate({
    params: FundraiserItemRouteParams,
    body: UpdateFundraiserItemBody,
  }),
  authenticate,
  updateFundraiserItemHandler
);

fundraiserRouter.delete(
  "/:fundraiserId/items/:itemId/delete",
  validate({
    params: FundraiserItemRouteParams,
  }),
  authenticate,
  deleteFundraiserItemHandler
);

fundraiserRouter.post(
  "/:id/announcements/create",
  validate({ params: FundraiserRouteParams, body: CreateAnnouncementBody }),
  authenticate,
  createAnnouncementHandler
);

fundraiserRouter.delete(
  "/:fundraiserid/announcements/:announcementid/delete",
  validate({ params: DeleteAnnouncementRouteParams }),
  authenticate,
  deleteAnnouncementHandler
);

fundraiserRouter.get(
  "/:id/analytics",
  validate({ params: FundraiserRouteParams }),
  authenticate,
  getFundraiserAnalyticsHandler
);

export default fundraiserRouter;
