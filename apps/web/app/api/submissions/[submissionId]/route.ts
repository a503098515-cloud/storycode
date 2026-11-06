import { currentUserId } from "@project/auth";
import { getSubmissionById } from "@project/domain";
import { log } from "@project/log";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Unauthenticated" } },
      { status: 401 }
    );
  }

  const { submissionId } = await params;
  try {
    const submission = await getSubmissionById(userId, submissionId);
    if (!submission) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Submission not found" } },
        { status: 404 }
      );
    }

    return Response.json({ submission });
  } catch (err) {
    log.error({ err, userId, submissionId }, "Failed to get submission");
    // Keep database details in the log, not in the response.
    return Response.json(
      { error: { code: "INTERNAL", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}