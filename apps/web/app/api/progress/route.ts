import { currentUserId } from "@project/auth";
import { UpdateProgress, updateProgress } from "@project/domain";

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: { code: "BAD_JSON", message: "Body must be valid JSON" } },
      { status: 400 }
    );
  }

  const parsed = UpdateProgress.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  const progress = await updateProgress(userId, parsed.data);
  return Response.json({ progress });
}