import { Router } from "express";
import validate from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import {
  createReferralHandler,
  approveReferralHandler,
  getReferrersHandler,
} from "./referral.handlers";
import {
  FundraiserReferrersRouteParams,
  ApproveReferralRouteParams,
} from "./referral.types";

const referralRouter = Router({ mergeParams: true });

// Request to be a referrer for a fundraiser
referralRouter.post(
  "/",
  validate({ params: FundraiserReferrersRouteParams }),
  authenticate,
  createReferralHandler
);

// Approve a referrer request (admin only)
referralRouter.patch(
  "/:id/approve",
  validate({ params: ApproveReferralRouteParams }),
  authenticate,
  approveReferralHandler
);

// Get all referrers for a fundraiser (both approved and pending)
referralRouter.get(
  "/",
  validate({ params: FundraiserReferrersRouteParams }),
  getReferrersHandler
);

export default referralRouter;
