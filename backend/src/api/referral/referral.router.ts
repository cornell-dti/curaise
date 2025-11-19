import { Router } from "express";
import validate from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import {
  createReferralHandler,
  approveReferralHandler,
  getReferrersHandler,
} from "./referral.handlers";
import {
  ReferralRouteParams,
  FundraiserReferrersRouteParams,
} from "./referral.types";

const referralRouter = Router();

// Request to be a referrer for a fundraiser
referralRouter.post(
  "/fundraiser/:fundraiserId",
  validate({ params: FundraiserReferrersRouteParams }),
  authenticate,
  createReferralHandler
);

// Approve a referrer request (admin only)
referralRouter.patch(
  "/:id/approve",
  validate({ params: ReferralRouteParams }),
  authenticate,
  approveReferralHandler
);

// Get all referrers for a fundraiser (both approved and pending)
referralRouter.get(
  "/fundraiser/:fundraiserId",
  validate({ params: FundraiserReferrersRouteParams }),
  getReferrersHandler
);

export default referralRouter;
