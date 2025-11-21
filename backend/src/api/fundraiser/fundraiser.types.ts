import { z } from "zod";

export const FundraiserRouteParams = z.object({
  id: z.string().uuid(),
});
export type FundraiserRouteParams = z.infer<typeof FundraiserRouteParams>;

export const PickupEventRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  pickupEventId: z.string().uuid(),
});
export type PickupEventRouteParams = z.infer<typeof PickupEventRouteParams>;

export const FundraiserItemRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type FundraiserItemRouteParams = z.infer<
  typeof FundraiserItemRouteParams
>;

export const DeleteAnnouncementRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  announcementId: z.string().uuid(),
});
export type DeleteAnnouncementRouteParams = z.infer<
  typeof DeleteAnnouncementRouteParams
>;

export const ApproveReferralRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  referralId: z.string().uuid(),
});
export type ApproveReferralRouteParams = z.infer<
  typeof ApproveReferralRouteParams
>;
