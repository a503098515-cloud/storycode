import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@project/db";

export const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function currentUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  const session = await prisma.authSession.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    select: { userId: true },
  });
  return session?.userId ?? null;
}

export async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  const previousToken = jar.get(SESSION_COOKIE)?.value;
  const token = randomBytes(32).toString("hex");

  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });

  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  if (previousToken && /^[a-f0-9]{64}$/.test(previousToken)) {
    await prisma.authSession.deleteMany({
      where: { tokenHash: hashToken(previousToken) },
    });
  }
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    await prisma.authSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  jar.delete(SESSION_COOKIE);
}
