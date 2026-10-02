import { prisma } from "@project/db";
import type { UpdateProgressInput } from "../schemas/progress";

export function getProgress(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { currentLevelId: true },
  });
}

export function updateProgress(userId: string, input: UpdateProgressInput) {
  return prisma.user.update({
    where: { id: userId },
    data: { currentLevelId: input.currentLevelId },
    select: { currentLevelId: true },
  });
}