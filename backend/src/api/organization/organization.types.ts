import { z } from "zod";

export const OrganizationRouteParams = z.object({
  id: z.string().uuid(),
});
export type OrganizationRouteParams = z.infer<typeof OrganizationRouteParams>;

export const CreateOrganizationBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  instagramUsername: z.string().min(1).max(30).optional(),
  venmoUsername: z.string().min(1).max(30).optional(),
});

export type CreateOrganizationBody = z.infer<typeof CreateOrganizationBody>;
