import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  venmoUsername: z.string().min(1).max(255).nullish(),
});

// CRUD BODIES:

export const UpdateUserBody = z.object({
  name: z.string().min(1).max(255),
  venmoUsername: z
    .string()
    .transform((value) => (value.length === 0 ? undefined : value))
    .pipe(z.string().min(1).max(255).optional()),
});
