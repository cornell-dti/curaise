import { CompleteItemSchema } from "common";
import { z } from "zod";

export const ItemWithAvailabilitySchema = CompleteItemSchema.extend({
  confirmedCount: z.number(),
  available: z.number().nullable(),
});

export type ItemWithAvailability = z.infer<typeof ItemWithAvailabilitySchema>;
