import { z } from "zod";
import { UserSchema } from "./user";
import { BasicFundraiserSchema } from "./fundraiser";
import { BasicItemSchema } from "./item";

export const BasicOrderSchema = z.object({
  id: z.string().uuid(),
  paymentMethod: z.enum(["VENMO", "OTHER"]),
  paymentStatus: z.enum(["UNVERIFIABLE", "PENDING", "CONFIRMED"]),
  pickedUp: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  buyer: UserSchema,
  fundraiser: BasicFundraiserSchema,
});

export const CompleteOrderSchema = BasicOrderSchema.extend({
  items: z.array(
    z.object({
      quantity: z.number().int().positive(),
      item: BasicItemSchema,
    })
  ),
});

// CRUD BODIES:

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
