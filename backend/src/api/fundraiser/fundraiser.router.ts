import { Router } from "express";
import {
  CreateFundraiserBody,
  FundraiserRouteParams,
} from "./fundraiser.types";
import validate from "../../middleware/validate";
import {
  createFundraiserHandler,
  getAllFundraisersHandler,
  getFundraiserHandler,
  getFundraiserItemsHandler,
  getFundraiserOrdersHandler,
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

export default fundraiserRouter;
