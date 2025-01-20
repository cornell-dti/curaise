import { z } from "zod";

export const BasicItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
});

export const CompleteItemSchema = BasicItemSchema.extend({
  imageUrl: z.string().url().nullish(),
  offsale: z.boolean(),
});
