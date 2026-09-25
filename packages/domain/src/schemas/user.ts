// Validation for the sign-in input. Emails are normalized (trimmed,
// lowercased) before they hit the unique index.
import { z } from "zod";

export const Email = z.string().trim().toLowerCase().email("Enter a valid email address");

export const SignIn = z.object({
  email: Email,
});

export type SignInInput = z.infer<typeof SignIn>;
