import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

export const PendingUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

// CRUD BODIES:

export const UpdateUserBody = z.object({
  name: z.string().min(1).max(255),
});
