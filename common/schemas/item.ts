import { z } from "zod";
import { MoneySchema } from "./decimal";

export const ItemCategorySchema = z.enum([
  "DESSERTS",
  "FOOD",
  "DRINKS",
  "APPAREL",
  "OTHER",
]);

export type ItemCategory = z.infer<typeof ItemCategorySchema>;

export const BasicItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: MoneySchema,
  limit: z.number().int().positive().nullish(),
  category: ItemCategorySchema.default("OTHER"),
});

export const CompleteItemSchema = BasicItemSchema.extend({
  imageUrl: z.string().url().nullish(),
  offsale: z.boolean(),
});

export const ItemWithAvailabilitySchema = CompleteItemSchema.extend({
  confirmedCount: z.number(),
  available: z.number().nullable(),
});

// Seller-side view of an item, including the seller-only unit cost.
export const SellerItemSchema = CompleteItemSchema.extend({
  unitCost: MoneySchema.nullish(),
});

export type SellerItem = z.infer<typeof SellerItemSchema>;

export type ItemWithAvailability = z.infer<typeof ItemWithAvailabilitySchema>;
