import { describe, expect, it } from "vitest";
import { CreateSubmission } from "../src/schemas/submission";

describe("CreateSubmission Schema", () => {
  it("accepts a valid submission payload", () => {
    const result = CreateSubmission.safeParse({
      levelId: "lvl_01",
      codeSubmitted: "function solve() { return true; }",
      isPassed: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty levelId or codeSubmitted", () => {
    const result = CreateSubmission.safeParse({
      levelId: "",
      codeSubmitted: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects code string exceeding 10,000 chars", () => {
    const result = CreateSubmission.safeParse({
      levelId: "lvl_01",
      codeSubmitted: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("defaults isPassed to false if omitted", () => {
    const result = CreateSubmission.safeParse({
      levelId: "lvl_01",
      codeSubmitted: "console.log('hi')",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPassed).toBe(false);
    }
  });
});