import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

const CORNELL_EMAIL_DOMAIN = "@cornell.edu";

export const NetIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]+[0-9]+$/, "Invalid NetID");

export const normalizeNetId = (value: string) => {
  const netId = value.trim().toLowerCase();
  return netId.endsWith(CORNELL_EMAIL_DOMAIN)
    ? netId.slice(0, -CORNELL_EMAIL_DOMAIN.length)
    : netId;
};

export const PendingUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

// CRUD BODIES:

export const UpdateUserBody = z.object({
  name: z.string().min(1).max(255),
});
