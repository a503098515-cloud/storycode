import { currentUserId } from "@project/auth";
import { getLevel, LevelIdParam } from "@project/domain";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ levelId: string }> }
) {
  
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  
  const parsed = LevelIdParam.safeParse(await params);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

  try {
   
    const level = await getLevel(parsed.data.levelId);
    if (!level) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Level not found" } },
        { status: 404 }
      );
    }
    return Response.json({ level });

    
  } catch {
    
    return Response.json(
      { error: { code: "INTERNAL", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}