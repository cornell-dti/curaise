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
  venmoUsername: z.string().min(1).max(255).nullish(),
  venmoEmail: z.string().min(1).max(255).nullish(),
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

export const CreateFundraiserBody = z
  .object({
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
    pickupLocation: z.string(),
    buyingStartsAt: z.coerce.date(),
    buyingEndsAt: z.coerce.date(),
    pickupStartsAt: z.coerce.date(),
    pickupEndsAt: z.coerce.date(),
    organizationId: z.string().uuid(),
  })
  .refine(
    (data) => {
      const hasUsername = data.venmoUsername !== undefined;
      const hasEmail = data.venmoEmail !== undefined;
      return hasUsername === hasEmail;
    },
    {
      message:
        "Both Venmo username and email must be provided together, or both must be empty",
      path: ["venmoUsername"],
    }
  );

export const UpdateFundraiserBody = z
  .object({
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
    pickupLocation: z.string(),
    imageUrls: z.array(z.string().url()),
    buyingStartsAt: z.coerce.date(),
    buyingEndsAt: z.coerce.date(),
    pickupStartsAt: z.coerce.date(),
    pickupEndsAt: z.coerce.date(),
  })
  .refine(
    (data) => {
      const hasUsername = data.venmoUsername !== undefined;
      const hasEmail = data.venmoEmail !== undefined;
      return hasUsername === hasEmail;
    },
    {
      message:
        "Both Venmo username and email must be provided together, or both must be empty",
      path: ["venmoUsername"],
    }
  );

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
