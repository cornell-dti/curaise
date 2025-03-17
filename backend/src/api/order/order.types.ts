import { z } from "zod";

export const OrderRouteParams = z.object({
  id: z.string().uuid(),
});
export type OrderRouteParams = z.infer<typeof OrderRouteParams>;
