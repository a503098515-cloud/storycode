import { currentUserId } from "@project/auth";
import { CreateSubmission, createSubmission, listSubmissions } from "@project/domain";


export async function GET() {//GET all user for submis
  const userId = await currentUserId();
  if (!userId) {// If no user
    return Response.json({ error: { code: "UNAUTHENTICATED", message: "Unauthorized" } }, { status: 401 });
  }

  const submissions = await listSubmissions(userId);
  return Response.json({ submissions });// Return list 200 (ok)
}

export async function POST(req: Request) {//POST Create submis
  const userId = await currentUserId();
  if (!userId) {
    return Response.json({ error: { code: "UNAUTHENTICATED", message: "Unauthorized" } }, { status: 401 });
  }

  let body: unknown;// Read body from request
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { code: "BAD_JSON", message: "Invalid JSON" } }, { status: 400 });
  }


  const parsed = CreateSubmission.safeParse(body);// Check if data is good using Zod
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Validation error", details: parsed.error.flatten() } }, { status: 400 });
  }

const submission = await createSubmission(userId, parsed.data);
  return Response.json({ submission }, { status: 201 });
}
