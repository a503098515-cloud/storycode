import { describe, expect, it } from "vitest";
import { ChallengeTests } from "../src/schemas/challenge";

describe("ChallengeTests schema", () => {
  it("accepts a function name and JSON cases", () => {
    const result = ChallengeTests.safeParse({
      functionName: "greet",
      cases: [{ args: ["Ada", 1, null, [true], { a: 1 }], expected: "Hello, Ada!" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a function name that is not an identifier (it is spliced into code)", () => {
    const result = ChallengeTests.safeParse({
      functionName: "greet; alert(1)",
      cases: [{ args: [], expected: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero cases and more than 50", () => {
    const one = { args: [], expected: 1 };
    expect(ChallengeTests.safeParse({ functionName: "f", cases: [] }).success).toBe(false);
    expect(ChallengeTests.safeParse({ functionName: "f", cases: Array(51).fill(one) }).success).toBe(false);
    expect(ChallengeTests.safeParse({ functionName: "f", cases: Array(50).fill(one) }).success).toBe(true);
  });

  it("requires expected to be present", () => {
    expect(ChallengeTests.safeParse({ functionName: "f", cases: [{ args: [] }] }).success).toBe(false);
  });
});
