import { z } from "zod";

export const FundraiserRouteParams = z.object({
  id: z.string().uuid(),
});
export type FundraiserRouteParams = z.infer<typeof FundraiserRouteParams>;

export const FundraiserItemRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type FundraiserItemRouteParams = z.infer<
  typeof FundraiserItemRouteParams
>;

export const DeleteFundraiserItemRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type DeleteFundraiserItemRouteParams = z.infer<
  typeof DeleteFundraiserItemRouteParams
>;

export const DeleteAnnouncementRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  announcementId: z.string().uuid(),
});
export type DeleteAnnouncementRouteParams = z.infer<
  typeof DeleteAnnouncementRouteParams
>;
