import z from "zod";
import { MoneySchema } from "../../utils/decimal";

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

export const CreateFundraiserBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  imageUrls: z.array(z.string().url()),
  goalAmount: MoneySchema.optional(),
  pickupLocation: z.string(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),

  organizationId: z.string().uuid(),
});
export type CreateFundraiserBody = z.infer<typeof CreateFundraiserBody>;

export const UpdateFundraiserBody = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  goalAmount: MoneySchema.optional(),
  pickupLocation: z.string(),
  imageUrls: z.array(z.string().url()).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type UpdateFundraiserBody = z.infer<typeof UpdateFundraiserBody>;

export const CreateFundraiserItemBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  price: MoneySchema,
  imageUrl: z.string().url().optional(),
  offsale: z.boolean().optional(),
});
export type CreateFundraiserItemBody = z.infer<typeof CreateFundraiserItemBody>;

export const UpdateFundraiserItemBody = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: MoneySchema.optional(),
  imageUrl: z.string().url().optional(),
  offsale: z.boolean().optional(),
});
export type UpdateFundraiserItemBody = z.infer<typeof UpdateFundraiserItemBody>;

export const CreateAnnouncementBody = z.object({
  message: z.string(),
});
export type CreateAnnouncementBody = z.infer<typeof CreateAnnouncementBody>;

export const DeleteAnnouncementRouteParams = z.object({
  fundraiserId: z.string().uuid(),
  announcementId: z.string().uuid(),
});
export type DeleteAnnouncementRouteParams = z.infer<
  typeof DeleteAnnouncementRouteParams
>;
