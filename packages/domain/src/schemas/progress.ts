import { z } from "zod";

export const UpdateProgress = z.object({
  currentLevelId: z.string().trim().min(1),
});

export type UpdateProgressInput = z.infer<typeof UpdateProgress>;