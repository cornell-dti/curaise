import { z } from "zod";
import { MoneySchema } from "./decimal";

export const BasicItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: MoneySchema.nullish(),
});

export const CompleteItemSchema = BasicItemSchema.extend({
  imageUrl: z.string().url().nullish(),
  offsale: z.boolean(),
});
