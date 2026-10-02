import { currentUserId } from "@project/auth";
import { listLevels } from "@project/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  try {
    const levels = await listLevels();
    return Response.json({ levels });
  } catch {
    return Response.json(
      { error: { code: "INTERNAL", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}