import { z } from "zod";

export const ReferralRouteParams = z.object({
  id: z.string().uuid(),
});

export const FundraiserReferrersRouteParams = z.object({
  fundraiserId: z.string().uuid(),
});
