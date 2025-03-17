import { z } from "zod";

export const OrganizationRouteParams = z.object({
  id: z.string().uuid(),
});
export type OrganizationRouteParams = z.infer<typeof OrganizationRouteParams>;
