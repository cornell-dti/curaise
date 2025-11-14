import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

// CRUD BODIES:

export const UpdateUserBody = z.object({
  name: z.string().min(1).max(255),
});
