import { currentUserId } from "@project/auth";
import { UpdateProgress, updateProgress } from "@project/domain";

type UserIdResolver = () => Promise<string | null>;

export function createProgressHandler(resolveUserId: UserIdResolver = currentUserId) {
  return async function progressHandler(req: Request) {
    const userId = await resolveUserId();
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

    try {
      const progress = await updateProgress(userId, parsed.data);
      return Response.json({ progress });
    } catch (error) {
      const code = error instanceof Error && "code" in error ? error.code : undefined;

      if (code === "LEVEL_NOT_FOUND" || code === "P2025") {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "Level not found" } },
          { status: 404 }
        );
      }

      if (code === "P2002") {
        return Response.json(
          { error: { code: "CONFLICT", message: "Progress could not be saved" } },
          { status: 409 }
        );
      }

      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Unable to update progress" } },
        { status: 500 }
      );
    }
  };
}