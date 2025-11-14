import { z } from "zod";
import { UserSchema } from "./user";

export const BasicOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string(),
  authorized: z.boolean(),
  logoUrl: z.string().url().nullish(),
});

export const InvitedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export const CompleteOrganizationSchema = BasicOrganizationSchema.extend({
  websiteUrl: z.string().url().nullish(),
  instagramUsername: z.string().min(1).max(255).nullish(),

  admins: z.array(UserSchema),
  pendingAdmins: z.array(InvitedUserSchema),
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
  addedAdminsIds: z.array(z.string().uuid()),
  pendingAdminsEmails: z.array(z.string().email()),
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
  addedAdminsIds: z.array(z.string().uuid()), // appends additional admin ids, doesn't replace original
  pendingAdminsEmails: z.array(z.string().email()), // appends additional pending admin emails, doesn't replace original
});
