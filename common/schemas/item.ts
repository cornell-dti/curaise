import { z } from "zod";
import { MoneySchema } from "./decimal";

export const BasicItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: MoneySchema,
  limit: z.number().int().positive().nullish(),
});

export const CompleteItemSchema = BasicItemSchema.extend({
  imageUrl: z.string().url().nullish(),
  offsale: z.boolean(),
});

export const ItemWithAvailabilitySchema = CompleteItemSchema.extend({
  confirmedCount: z.number(),
  available: z.number().nullable(),
});

export type ItemWithAvailability = z.infer<typeof ItemWithAvailabilitySchema>;
