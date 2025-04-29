import { z } from "zod";
import { BasicOrganizationSchema } from "./organization";
import { MoneySchema } from "./decimal";

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  createdAt: z.coerce.date(),
});

export const BasicFundraiserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string(),
  goalAmount: MoneySchema.nullish(),
  pickupLocation: z.string(),
  buyingStartsAt: z.coerce.date(),
  buyingEndsAt: z.coerce.date(),
  pickupStartsAt: z.coerce.date(),
  pickupEndsAt: z.coerce.date(),
  organization: BasicOrganizationSchema,
  imageUrls: z.array(z.string().url()),
});

export const CompleteFundraiserSchema = BasicFundraiserSchema.extend({
  announcements: z.array(AnnouncementSchema),
});

// CRUD BODIES:

export const CreateFundraiserBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  imageUrls: z.array(z.string().url()),
  goalAmount: MoneySchema.optional(),
  pickupLocation: z.string(),
  buyingStartsAt: z.coerce.date(),
  buyingEndsAt: z.coerce.date(),
  pickupStartsAt: z.coerce.date(),
  pickupEndsAt: z.coerce.date(),

  organizationId: z.string().uuid(),
});

export const UpdateFundraiserBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  goalAmount: MoneySchema.optional(),
  pickupLocation: z.string(),
  imageUrls: z.array(z.string().url()),
  buyingStartsAt: z.coerce.date(),
  buyingEndsAt: z.coerce.date(),
  pickupStartsAt: z.coerce.date(),
  pickupEndsAt: z.coerce.date(),
});

export const CreateFundraiserItemBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  price: MoneySchema,
  imageUrl: z.string().url().optional(),
  offsale: z.boolean(),
});

export const UpdateFundraiserItemBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  price: MoneySchema,
  imageUrl: z.string().url().optional(),
  offsale: z.boolean(),
});

export const CreateAnnouncementBody = z.object({
  message: z.string(),
});
