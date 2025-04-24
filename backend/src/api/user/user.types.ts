import { z } from "zod";

export const UserRouteParams = z.object({
  id: z.string().uuid(),
});
export type UserRouteParams = z.infer<typeof UserRouteParams>;

export const UserSearchQueryParams = z.object({
  email: z.string().email(),
});
export type UserSearchQueryParams = z.infer<typeof UserSearchQueryParams>;
