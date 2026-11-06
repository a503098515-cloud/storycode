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

export async function findOrCreateOAuthUser(
  provider: "google" | "github",
  providerAccountId: string,
  name: string,
  email: string | null
) {
  const where = { provider_providerAccountId: { provider, providerAccountId } };
  const existing = await prisma.oAuthAccount.findUnique({
    where,
    include: { user: true },
  });
  if (existing) return existing.user;

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name } });
      await tx.oAuthAccount.create({
        data: { ...where.provider_providerAccountId, email, userId: user.id },
      });
      return user;
    });
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    const account = await prisma.oAuthAccount.findUnique({
      where,
      include: { user: true },
    });
    if (!account) throw error;
    return account.user;
  }
}
