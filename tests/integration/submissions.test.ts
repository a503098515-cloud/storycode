import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUserId: vi.fn(),
  createSubmission: vi.fn(),
  listSubmissions: vi.fn(),
  getSubmissionById: vi.fn(),
  safeParse: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("../../packages/auth/src/current-user", () => ({
  currentUserId: mocks.currentUserId,
}));

vi.mock("../../packages/domain/src/index", () => ({
  CreateSubmission: { safeParse: mocks.safeParse },
  createSubmission: mocks.createSubmission,
  listSubmissions: mocks.listSubmissions,
  getSubmissionById: mocks.getSubmissionById,
}));

vi.mock("../../packages/log/src/index", () => ({
  log: { error: mocks.logError },
}));

import { GET as listSubmissionsRoute, POST as createSubmissionRoute } from "../../apps/web/app/api/submissions/route";
import { GET as getSubmissionRoute } from "../../apps/web/app/api/submissions/[submissionId]/route";

describe("submission routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.currentUserId.mockResolvedValue("user-1");
    mocks.safeParse.mockReturnValue({
      success: true,
      data: { levelId: "level-1", codeSubmitted: "return 1;" },
    });
  });

  it("returns a generic 500 and logs when listing submissions fails", async () => {
    mocks.listSubmissions.mockRejectedValue(new Error("database credentials"));

    const response = await listSubmissionsRoute();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: { code: "INTERNAL", message: "Something went wrong" },
    });
    expect(mocks.logError).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "Failed to list submissions"
    );
    expect(JSON.stringify(body)).not.toContain("database credentials");
  });

  it("returns a generic 500 and logs when creating a submission fails", async () => {
    mocks.createSubmission.mockRejectedValue(new Error("database credentials"));
    const request = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ levelId: "level-1", codeSubmitted: "return 1;" }),
    });

    const response = await createSubmissionRoute(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL", message: "Something went wrong" },
    });
    expect(mocks.logError).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "Failed to create submission"
    );
  });

  it("returns a generic 500 and logs when getting one submission fails", async () => {
    mocks.getSubmissionById.mockRejectedValue(new Error("database credentials"));

    const response = await getSubmissionRoute(new Request("http://localhost"), {
      params: Promise.resolve({ submissionId: "submission-1" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL", message: "Something went wrong" },
    });
    expect(mocks.logError).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", submissionId: "submission-1" }),
      "Failed to get submission"
    );
  });
});
