"use client";

// Code editor + submit for one level. When the level has challengeTests, the
// player can run them, and submit runs them first to compute isPassed.
// Behavior: docs/specs/levels/coding-challenge.md
import { useMemo, useState } from "react";
import { ChallengeTests, type ChallengeTestsInput, type RunResult } from "@project/domain/challenge";
import { CodeEditor } from "@/components/CodeEditor";
import { TestResults } from "@/components/TestResults";
import { runInWorker } from "@/lib/run-in-worker";

type FormStatus = "idle" | "running" | "submitting" | "error";

const MAX_CODE_LENGTH = 10000;

interface SubmissionFormProps {
  levelId: string;
  starterCode: string | null;
  /** Raw JSON from the API; validated here before anything runs. */
  challengeTests: unknown;
}

export function SubmissionForm({ levelId, starterCode, challengeTests }: SubmissionFormProps) {
  const [codeSubmitted, setCodeSubmitted] = useState(starterCode ?? "");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [testsRunning, setTestsRunning] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // null = this level has no tests; "invalid" = the stored tests are malformed.
  const tests = useMemo<ChallengeTestsInput | "invalid" | null>(() => {
    if (challengeTests == null) return null;
    const parsed = ChallengeTests.safeParse(challengeTests);
    return parsed.success ? parsed.data : "invalid";
  }, [challengeTests]);
  const runnable = tests !== null && tests !== "invalid" ? tests : null;

  const isEmpty = codeSubmitted.trim() === "";
  const isTooLong = codeSubmitted.length > MAX_CODE_LENGTH;
  const isBusy = status === "running" || status === "submitting";
  // Invalid code uses native `disabled`; busy uses aria-disabled so the
  // pressed button keeps focus (a disabled button drops it to <body>).
  const isSubmitDisabled = isEmpty || isTooLong || isBusy;
  const labelId = `code-label-${levelId}`;

  function handleChange(next: string) {
    setCodeSubmitted(next);
    setResult(null);
    setSavedMessage(null);
    if (status === "error") setStatus("idle");
  }

  async function handleRun() {
    if (!runnable || isEmpty || isBusy) return;
    setStatus("running");
    setSavedMessage(null);
    setTestsRunning(true);
    setResult(await runInWorker(codeSubmitted, runnable));
    setTestsRunning(false);
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setStatus("submitting");
    setErrorMessage(null);
    setSavedMessage(null);

    let isPassed = false;
    if (runnable) {
      setTestsRunning(true);
      const run = await runInWorker(codeSubmitted, runnable);
      setResult(run);
      setTestsRunning(false);
      isPassed = run.passed;
    }

    try {
      let res: Response;
      try {
        res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ levelId, codeSubmitted, isPassed }),
        });
      } catch {
        // fetch rejects only when the network fails; its message is browser-specific.
        throw new Error("Network request failed, please check your connection");
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to submit code, please try again");
      }
      setStatus("idle");
      setSavedMessage(
        runnable
          ? isPassed
            ? "Submitted — every test passed!"
            : "Submitted. Some tests are still failing — keep going."
          : "Code submitted successfully!",
      );
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error && err.message ? err.message : "Network request failed, please check your connection",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div>
        <p id={labelId} className="mb-1 block text-xs font-semibold uppercase text-neutral-500">
          Your Solution
        </p>
        <CodeEditor value={codeSubmitted} onChange={handleChange} disabled={isBusy} labelledBy={labelId} />
        {isTooLong && (
          <p className="mt-1 text-xs text-red-700">
            Code length exceeds 10,000 characters limit ({codeSubmitted.length}/{MAX_CODE_LENGTH})
          </p>
        )}
      </div>

      {tests === "invalid" && (
        <p className="text-xs font-medium text-amber-700">
          This level&apos;s tests couldn&apos;t be loaded, so your code can&apos;t be checked right now.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {runnable && (
          <button
            type="button"
            onClick={handleRun}
            disabled={isEmpty}
            aria-disabled={isBusy || undefined}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            Run tests
          </button>
        )}
        <button
          type="submit"
          disabled={isEmpty || isTooLong}
          aria-disabled={isBusy || undefined}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          Submit Solution
        </button>
      </div>

      {/* Always rendered so submit outcomes are announced (see TestResults). */}
      <p
        role="status"
        className={`min-h-4 text-xs font-medium ${status === "error" ? "text-red-700" : "text-green-700"}`}
      >
        {status === "error" ? errorMessage : savedMessage}
      </p>

      {runnable && <TestResults running={testsRunning} result={result} functionName={runnable.functionName} />}
    </form>
  );
}
