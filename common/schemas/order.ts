import { z } from "zod";
import { UserSchema } from "./user";
import { BasicFundraiserSchema, ReferralSchema } from "./fundraiser";
import { CompleteItemSchema } from "./item";
import { MoneySchema } from "./decimal";

export const BasicOrderSchema = z.object({
  id: z.string().uuid(),
  paymentMethod: z.enum(["VENMO", "ZELLE", "OTHER"]),
  paymentStatus: z.enum(["UNVERIFIABLE", "PENDING", "CONFIRMED"]),
  pickedUp: z.boolean(),
  paidAmount: MoneySchema.nullish(),
  paymentMismatchAt: z.coerce.date().nullish(),
  buyerName: z.string().nullish(),
  buyerNetId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  buyer: UserSchema,
  fundraiser: BasicFundraiserSchema,
  referral: ReferralSchema.nullish(),
});

export const CompleteOrderSchema = BasicOrderSchema.extend({
  items: z.array(
    z.object({
      quantity: z.number().int().positive(),
      item: CompleteItemSchema,
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
  payment_method: z.enum(["VENMO", "ZELLE", "OTHER"]),
  referralId: z.string().uuid().optional(),
  markAsPickedUp: z.boolean().optional(),
  // Seller-entered buyer for manual orders (Zelle, cash, on someone's behalf)
  buyerName: z.string().trim().min(1).max(255).optional(),
  buyerNetId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]+[0-9]+$/, "Invalid NetID")
    .optional(),
}).superRefine((body, ctx) => {
  if ((body.buyerName === undefined) !== (body.buyerNetId === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Buyer name and NetID must be provided together",
      path: [body.buyerName === undefined ? "buyerName" : "buyerNetId"],
    });
  }

  const seenItemIds = new Set<string>();

  body.items.forEach((item, index) => {
    if (seenItemIds.has(item.itemId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate items are not allowed in a single order",
        path: ["items", index, "itemId"],
      });
      return;
    }

    seenItemIds.add(item.itemId);
  });
});
