import { z } from "zod";

export const OrderRouteParams = z.object({
  id: z.string().uuid(),
});
export type OrderRouteParams = z.infer<typeof OrderRouteParams>;

export const CreateOrderBody = z.object({
  fundraiserId: z.string().uuid(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  payment_method: z.enum(["VENMO", "OTHER"]),
});
export type CreateOrderBody = z.infer<typeof CreateOrderBody>;
