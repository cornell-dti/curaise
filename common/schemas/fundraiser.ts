import { z } from "zod";
import { BasicOrganizationSchema } from "./organization";
import { MoneySchema } from "./decimal";
import { UserSchema } from "./user";

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  createdAt: z.coerce.date(),
});

export const PickupEventSchema = z.object({
  id: z.string().uuid(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  location: z.string(),
});

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
  referrer: UserSchema,
});

export const BasicFundraiserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string(),
  published: z.boolean(),
  venmoUsername: z.string().min(1).max(255).nullish(),
  venmoEmail: z.string().min(1).max(255).nullish(),
  goalAmount: MoneySchema.nullish(),
  buyingStartsAt: z.coerce.date(),
  buyingEndsAt: z.coerce.date(),
  organization: BasicOrganizationSchema,
  imageUrls: z.array(z.string().url()),
  pickupEvents: z.array(PickupEventSchema),
});

export const CompleteFundraiserSchema = BasicFundraiserSchema.extend({
  announcements: z.array(AnnouncementSchema),
  referrals: z.array(ReferralSchema),
});

// CRUD BODIES:

export const CreatePickupEventBody = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  location: z.string(),
});

export const UpdatePickupEventBody = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  location: z.string(),
});

// fundraisers must be created with at least one pickup event
export const CreateFundraiserBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  venmoUsername: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().min(5).max(30).optional()),
  venmoEmail: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().email().optional()),
  imageUrls: z.array(z.string().url()),
  goalAmount: MoneySchema.optional(),
  buyingStartsAt: z.coerce.date(),
  buyingEndsAt: z.coerce.date(),
  organizationId: z.string().uuid(),
  pickupEvents: z.array(CreatePickupEventBody).min(1),
});

// pickup events are updated/deleted separately
export const UpdateFundraiserBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  venmoUsername: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().min(5).max(30).optional()),
  venmoEmail: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().email().optional()),
  goalAmount: MoneySchema.optional(),
  imageUrls: z.array(z.string().url()),
  buyingStartsAt: z.coerce.date(),
  buyingEndsAt: z.coerce.date(),
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
