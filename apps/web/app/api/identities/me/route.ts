import { currentUserId } from "@project/auth";
import { getUser } from "@project/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await currentUserId();
  if (!userId){
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 }
    );
  } 

  const user = await getUser(userId);

  if (!user) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currentLevelId: user.currentLevelId,
    },
  });

}
