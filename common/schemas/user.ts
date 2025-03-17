import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  venmoUsername: z.string().min(1).max(255).nullish(),
});

export const UpdateUserBody = z.object({
  name: z.string().min(1).max(255).optional(),
  venmoUsername: z.string().min(1).max(255).optional(),
});
