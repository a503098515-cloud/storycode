// Browser-safe entry point (`@project/domain/challenge`). Imports nothing
// from Prisma, unlike the package root, so client components can use it.
export { ChallengeTests, type ChallengeTestsInput, type JsonValue } from "../schemas/challenge";
export { runChallengeTests, failAll, deepEqual, formatValue, type CaseResult, type RunResult } from "./run-tests";
