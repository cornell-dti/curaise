import { z } from "zod";
import { BasicOrganizationSchema } from "./organization";
import { MoneySchema } from "./decimal";

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  createdAt: z.date(),
});

export const BasicFundraiserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string(),
  goalAmount: MoneySchema.nullish(),
  pickupLocation: z.string(),
  startsAt: z.date(),
  endsAt: z.date(),
  organization: BasicOrganizationSchema,
});

export const CompleteFundraiserSchema = BasicFundraiserSchema.extend({
  imageUrls: z.array(z.string().url()),
  announcements: z.array(AnnouncementSchema),
});
