import { Request, Response } from "express-serve-static-core";
import {
  FundraiserReferrersRouteParams,
  ApproveReferralRouteParams,
} from "./referral.types";
import {
  getReferral,
  createReferral,
  approveReferral,
  getReferrersForFundraiser,
} from "./referral.services";
import { ReferralSchema } from "common";
import { z } from "zod";
import { getFundraiser } from "../fundraiser/fundraiser.services";

export const createReferralHandler = async (
  req: Request<z.infer<typeof FundraiserReferrersRouteParams>, any, {}, {}>,
  res: Response
) => {
  // Check if fundraiser exists
  const fundraiser = await getFundraiser(req.params.fundraiserId);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if fundraiser is published
  if (!fundraiser.published) {
    res.status(400).json({ message: "Fundraiser is not published" });
    return;
  }

  // Create referral request
  const referral = await createReferral({
    fundraiserId: req.params.fundraiserId,
    referrerId: res.locals.user!.id,
  });

  if (!referral) {
    res
      .status(409)
      .json({ message: "Referral request already exists for this fundraiser" });
    return;
  }

  // Parse and return
  const parsedReferral = ReferralSchema.safeParse(referral);
  if (!parsedReferral.success) {
    res.status(500).json({ message: "Couldn't parse referral" });
    return;
  }

  res
    .status(201)
    .json({ message: "Referral request created", data: parsedReferral.data });
};

export const approveReferralHandler = async (
  req: Request<z.infer<typeof ApproveReferralRouteParams>, any, {}, {}>,
  res: Response
) => {
  // Get referral with fundraiser organization info
  const referral = await getReferral(req.params.id);
  if (!referral) {
    res.status(404).json({ message: "Referral not found" });
    return;
  }

  // Validate that referral's fundraiserId matches URL param
  if (referral.fundraiserId !== req.params.fundraiserId) {
    res.status(400).json({ message: "Referral does not belong to this fundraiser" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !referral.fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to approve referral" });
    return;
  }

  // Check if already approved
  if (referral.approved) {
    res.status(400).json({ message: "Referral is already approved" });
    return;
  }

  // Approve referral
  const approvedReferral = await approveReferral(req.params.id);
  if (!approvedReferral) {
    res.status(500).json({ message: "Failed to approve referral" });
    return;
  }

  // Parse and return
  const parsedReferral = ReferralSchema.safeParse(approvedReferral);
  if (!parsedReferral.success) {
    res.status(500).json({ message: "Couldn't parse referral" });
    return;
  }

  res
    .status(200)
    .json({ message: "Referral approved", data: parsedReferral.data });
};

export const getReferrersHandler = async (
  req: Request<z.infer<typeof FundraiserReferrersRouteParams>, any, {}, {}>,
  res: Response
) => {
  // Check if fundraiser exists
  const fundraiser = await getFundraiser(req.params.fundraiserId);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Get all referrers (both approved and pending)
  const referrals = await getReferrersForFundraiser(req.params.fundraiserId);

  // Parse each referral
  const parsedReferrals = referrals
    .map((referral) => ReferralSchema.safeParse(referral))
    .filter((result) => result.success)
    .map((result) => result.data);

  res.status(200).json({
    message: "Referrers retrieved",
    data: parsedReferrals,
  });
};
