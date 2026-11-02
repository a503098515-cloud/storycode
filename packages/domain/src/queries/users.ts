// Database queries for users.
import { prisma } from "@project/db";

export function getUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function createCredentialUser(username: string, passwordHash: string) {
  return prisma.user.create({
    data: { username, name: username, passwordHash },
  });
}

export function findOrCreateUser(email: string, name = email.split("@")[0] ?? email) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });
}
