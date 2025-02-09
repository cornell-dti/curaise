import { Router } from "express";
import {
  CreateFundraiserBody,
  FundraiserRouteParams,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  FundraiserItemRouteParams,
} from "./fundraiser.types";
import validate from "../../middleware/validate";
import {
  createFundraiserHandler,
  getAllFundraisersHandler,
  getFundraiserHandler,
  getFundraiserItemsHandler,
  getFundraiserOrdersHandler,
  createFundraiserItemHandler,
  updateFundraiserItemHandler,
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
  validate({ params: FundraiserRouteParams, body: CreateFundraiserBody }),
  authenticate,
  createFundraiserHandler
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

export default fundraiserRouter;
