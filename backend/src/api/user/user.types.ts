import { z } from "zod";

export const UserRouteParams = z.object({
  id: z.string().uuid(),
});
export type UserRouteParams = z.infer<typeof UserRouteParams>;

export const UpdateUserBody = z.object({
  name: z.string().min(1).max(255).optional(),
  venmoUsername: z.string().min(1).max(255).optional(),
});
export type UpdateUserBody = z.infer<typeof UpdateUserBody>;
