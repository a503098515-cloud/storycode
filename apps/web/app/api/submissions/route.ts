import { currentUserId } from "@project/auth";
import { CreateSubmission, createSubmission, listSubmissions } from "@project/domain";
import { log } from "@project/log";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const submissions = await listSubmissions(userId);
    return Response.json({ submissions });
  } catch (err) {
    log.error({ err, userId }, "Failed to list submissions");
    // Keep database details in the log, not in the response.
    return Response.json(
      { error: { code: "INTERNAL", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { code: "BAD_JSON", message: "Invalid JSON" } }, { status: 400 });
  }

  const parsed = CreateSubmission.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation error",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  try {
    const submission = await createSubmission(userId, parsed.data);
    return Response.json({ submission }, { status: 201 });
  } catch (err) {
    log.error({ err, userId }, "Failed to create submission");
    // Keep database details in the log, not in the response.
    return Response.json(
      { error: { code: "INTERNAL", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
