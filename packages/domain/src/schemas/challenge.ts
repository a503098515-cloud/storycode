// The shape of a level's unit tests, stored in Level.challengeTests.
// Tests are JSON data — never code — so the server never evaluates anything.
import { z } from "zod";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const JsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(JsonValue), z.record(JsonValue)]),
);

export const ChallengeTests = z.object({
  functionName: z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "functionName must be a JavaScript identifier"),
  cases: z
    .array(z.object({ args: z.array(JsonValue), expected: JsonValue }))
    .min(1, "At least one test case is required")
    .max(50, "At most 50 test cases"),
});

export type ChallengeTestsInput = z.infer<typeof ChallengeTests>;
