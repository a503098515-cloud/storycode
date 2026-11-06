// Web Worker entry: runs a player's code against a level's tests off the main
// thread, so the page can terminate it on timeout. See ADR-0012.
import { failAll, runChallengeTests, type ChallengeTestsInput } from "@project/domain/challenge";

export type WorkerRequest = { code: string; tests: ChallengeTestsInput };
export type WorkerMessage = { type: "ready" } | { type: "result"; result: ReturnType<typeof runChallengeTests> };

// The app's tsconfig uses the DOM lib, so type the worker global by hand.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerMessage) => void;
};
// Captured before any player code runs, so reassigning postMessage can't
// swallow the result.
const post = scope.postMessage.bind(scope);

scope.onmessage = (event) => {
  const { code, tests } = event.data;
  let result;
  try {
    result = runChallengeTests(code, tests);
  } catch {
    result = failAll(tests, "The test runner crashed while checking your code.");
  }
  post({ type: "result", result });
};

post({ type: "ready" });
