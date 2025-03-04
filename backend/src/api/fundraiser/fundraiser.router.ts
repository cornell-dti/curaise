import { Router } from "express";
import {
  CreateFundraiserBody,
  FundraiserRouteParams,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  FundraiserItemRouteParams,
  CreateAnnouncementBody,
  DeleteAnnouncementRouteParams,
} from "./fundraiser.types";
import validate from "../../middleware/validate";
import {
  createFundraiserHandler,
  getAllFundraisersHandler,
  getFundraiserHandler,
  updateFundraiserHandler,
  getFundraiserItemsHandler,
  getFundraiserOrdersHandler,
  createFundraiserItemHandler,
  updateFundraiserItemHandler,
  createAnnouncementHandler,
  deleteAnnouncementHandler,
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

export default fundraiserRouter;
