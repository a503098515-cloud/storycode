import { prisma } from "@project/db";

export function listLevels() {
  return prisma.level.findMany({ orderBy: { order: "asc" } });
}

export function getLevel(id: string) {
  return prisma.level.findUnique({ where: { id } });
}

