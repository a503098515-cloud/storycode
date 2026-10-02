// Validation for the sign-in input. Emails are normalized (trimmed,
// lowercased) before they hit the unique index.
import { z } from "zod";

export const LevelIdParam = z.object({
  levelId: z.string().trim().min(1, "Level id is reuired"),
});
