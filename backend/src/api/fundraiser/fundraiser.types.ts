import z from "zod";

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