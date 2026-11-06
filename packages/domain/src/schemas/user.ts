// Validation for username/password sign-in. Usernames are case-insensitive;
// passwords are preserved exactly as entered.
import { z } from "zod";

export const Email = z.string().trim().toLowerCase().email("Enter a valid email address");

export const SignIn = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-z0-9_]+$/, "Use only letters, numbers, and underscores in your username"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters"),
});

export type SignInInput = z.infer<typeof SignIn>;
