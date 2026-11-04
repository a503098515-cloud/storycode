"use client";

// Code editor + submit for one level. When the level has challengeTests, the
// player can run them, and submit runs them first to compute isPassed.
// Behavior: docs/specs/levels/coding-challenge.md
import { useMemo, useState } from "react";
import { ChallengeTests, type ChallengeTestsInput, type RunResult } from "@project/domain/challenge";
import { CodeEditor } from "@/components/CodeEditor";
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
    setResult(await runInWorker(codeSubmitted, runnable));
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
      const run = await runInWorker(codeSubmitted, runnable);
      setResult(run);
      isPassed = run.passed;
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId, codeSubmitted, isPassed }),
      });
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
          <p className="mt-1 text-xs text-red-500">
            Code length exceeds 10,000 characters limit ({codeSubmitted.length}/{MAX_CODE_LENGTH})
          </p>
        )}
      </div>

      {tests === "invalid" && (
        <p className="text-xs font-medium text-amber-700">
          This level&apos;s tests couldn&apos;t be loaded, so your code can&apos;t be checked right now.
        </p>
      )}

      {result && runnable && <TestResults result={result} functionName={runnable.functionName} />}

      {status === "error" && <p className="text-xs font-medium text-red-600">{errorMessage}</p>}

      {savedMessage && (
        <p role="status" className="text-xs font-medium text-green-700">
          {savedMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {runnable && (
          <button
            type="button"
            onClick={handleRun}
            disabled={isEmpty || isBusy}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "running" ? "Running…" : "Run tests"}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          aria-busy={status === "submitting"}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* Show a spinner while the submission is being sent. */}
          {status === "submitting" ? (
            <span className="inline-flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4 animate-spin"
                fill="none"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Submitting…
            </span>
          ) : (
            "Submit Solution"
          )}
        </button>
      </div>
    </form>
  );
}

function TestResults({ result, functionName }: { result: RunResult; functionName: string }) {
  const passedCount = result.cases.filter((c) => c.passed).length;
  return (
    <section aria-label="Test results" className="rounded-lg border border-neutral-200 bg-white p-3">
      <p
        role="status"
        className={`text-sm font-semibold ${result.passed ? "text-green-700" : "text-red-700"}`}
      >
        {passedCount} of {result.cases.length} tests passed
      </p>
      <ul className="mt-2 space-y-2">
        {result.cases.map((c, i) => (
          <li key={i} className="font-mono text-xs leading-5">
            <span aria-hidden="true" className={c.passed ? "text-green-600" : "text-red-600"}>
              {c.passed ? "✓" : "✗"}
            </span>{" "}
            <span className="sr-only">{c.passed ? "Passed: " : "Failed: "}</span>
            <span className="text-neutral-800">
              {functionName}({c.args})
            </span>
            {!c.passed && (
              <div className="ml-4 text-neutral-600">
                <div>expected: {c.expected}</div>
                {c.error ? (
                  <div className="text-red-700">error: {c.error}</div>
                ) : (
                  <div>got: {c.actual}</div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
