import z from "zod";
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
