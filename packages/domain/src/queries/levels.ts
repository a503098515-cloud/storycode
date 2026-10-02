import { prisma } from "@project/db";

export function listLevels() {
  return prisma.level.findMany({ orderBy: { order: "asc" } });
}

export function getLevel(id: string) {
  return prisma.level.findUnique({ where: { id } });
}

export function listSubmissions(userId: string) {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { level: true },
  });
}

export function createSubmission(
  userId: string,
  levelId: string,
  codeSubmitted: string,
  isPassed = false
) {
  return prisma.submission.create({
    data: { userId, levelId, codeSubmitted, isPassed },
  });
}