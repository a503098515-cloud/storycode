// Database queries for users. Sign-in is find-or-create by unique email.
import { prisma } from "@project/db";

export function getUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findOrCreateUser(email: string, name = email.split("@")[0] ?? email) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });
}
