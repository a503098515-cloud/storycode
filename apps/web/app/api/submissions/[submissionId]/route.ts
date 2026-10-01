import { currentUserId } from "@project/auth";
import { getSubmissionById } from "@project/domain";

export async function GET(//(Get ID
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const userId = await currentUserId();
  // not sigin 401
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Unauthenticated" } },
      { status: 401 }
    );
  }

  const { submissionId } = await params;// from URL parameters read submissionId 
  const submission = await getSubmissionById(userId, submissionId);// Find item in database
  if (!submission) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Submission not found" } },
      { status: 404 }
    );
  }

  return Response.json({ submission });
}