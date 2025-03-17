import { z } from "zod";

export const UserRouteParams = z.object({
  id: z.string().uuid(),
});
export type UserRouteParams = z.infer<typeof UserRouteParams>;
