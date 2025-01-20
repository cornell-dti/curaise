import { z } from "zod";
import { BasicOrganizationSchema } from "./organization";

export const BasicFundraiserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string(),
  startsAt: z.date(),
  endsAt: z.date(),
  organization: BasicOrganizationSchema,
});

export const CompleteFundraiserSchema = BasicFundraiserSchema.extend({
  imageUrls: z.array(z.string().url()),
});
