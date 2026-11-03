// Runs challenge tests in a fresh Web Worker and enforces the time limit.
// The clock starts when the worker reports ready, so a slow first load in
// dev isn't blamed on the player's code.
import { failAll, type ChallengeTestsInput, type RunResult } from "@project/domain/challenge";
import type { WorkerMessage } from "./challenge.worker";

export const RUN_TIME_LIMIT_MS = 2000;
const START_TIME_LIMIT_MS = 15000;

export function runInWorker(code: string, tests: ChallengeTestsInput): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./challenge.worker.ts", import.meta.url), { type: "module" });
    let timer = setTimeout(
      () => finish(failAll(tests, "The test runner didn't start. Reload the page and try again.")),
      START_TIME_LIMIT_MS,
    );

    function finish(result: RunResult) {
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    }

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.type === "ready") {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            finish(
              failAll(
                tests,
                `Your code took longer than ${RUN_TIME_LIMIT_MS / 1000} seconds, so it was stopped. Check for a loop that never ends.`,
              ),
            ),
          RUN_TIME_LIMIT_MS,
        );
        worker.postMessage({ code, tests });
      } else {
        finish(event.data.result);
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(failAll(tests, "The test runner failed to start. Reload the page and try again."));
    };
  });
}
