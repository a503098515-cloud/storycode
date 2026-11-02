// Sign-in by username/password; the first use of a username creates its account.

import { hashPassword, startSession, verifyPassword } from "@project/auth";
import {
  SignIn,
  createCredentialUser,
  getUserByUsername,
} from "@project/domain";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: { code: "BAD_JSON", message: "Body must be valid JSON" } },
      { status: 400 }
    );
  }

  const parsed = SignIn.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  let user = await getUserByUsername(username);
  if (user) {
    if (!user.passwordHash) {
      await hashPassword(password);
      return Response.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Username or password is incorrect" } },
        { status: 401 }
      );
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return Response.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Username or password is incorrect" } },
        { status: 401 }
      );
    }
  } else {
    const passwordHash = await hashPassword(password);
    try {
      user = await createCredentialUser(username, passwordHash);
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== "P2002"
      ) {
        throw error;
      }

      user = await getUserByUsername(username);
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        return Response.json(
          { error: { code: "INVALID_CREDENTIALS", message: "Username or password is incorrect" } },
          { status: 401 }
        );
      }
    }
  }

  await startSession(user.id);

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
  });
}
