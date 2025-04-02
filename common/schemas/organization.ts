import { z } from "zod";
import { UserSchema } from "./user";

export const BasicOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string(),
  authorized: z.boolean(),
  logoUrl: z.string().url().nullish(),
});

export const CompleteOrganizationSchema = BasicOrganizationSchema.extend({
  websiteUrl: z.string().url().nullish(),
  instagramUsername: z.string().min(1).max(255).nullish(),
  venmoUsername: z.string().min(1).max(255).nullish(),
  venmoForwardingVerified: z.boolean(),

  admins: z.array(UserSchema),
});

// CRUD BODIES:

export const CreateOrganizationBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().url().optional()),
  instagramUsername: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().min(1).max(30).optional()),
  venmoUsername: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().min(5).max(30).optional()),
  addedAdminsIds: z.array(z.string().uuid()),
});

export const UpdateOrganizationBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().url().optional()),
  instagramUsername: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().min(1).max(30).optional()),
  venmoUsername: z
    .string()
    .optional()
    .transform((value) =>
      value ? (value.length === 0 ? undefined : value) : undefined
    )
    .pipe(z.string().min(5).max(30).optional()),
  addedAdminsIds: z.array(z.string().uuid()), // appends additional admin ids, doesn't replace original
});
