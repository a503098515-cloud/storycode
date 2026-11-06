// Test feedback for a coding level: a live-region summary plus one list item
// per test case. The status region is rendered on every render — empty until
// a run starts — because screen readers only announce changes to a live
// region that already exists. Behavior: docs/specs/levels/coding-challenge.md
import type { RunResult } from "@project/domain/challenge";

interface TestResultsProps {
  running: boolean;
  result: RunResult | null;
  functionName: string;
}

export function summarize(result: RunResult): string {
  const passed = result.cases.filter((c) => c.passed).length;
  return `${passed} of ${result.cases.length} tests passed.`;
}

export function TestResults({ running, result, functionName }: TestResultsProps) {
  const announcement = running ? "Running tests…" : result ? summarize(result) : "";
  const tone = running || !result ? "text-neutral-600" : result.passed ? "text-green-700" : "text-red-700";

  return (
    <div className="space-y-2">
      <p role="status" className={`min-h-5 text-sm font-semibold ${tone}`}>
        {announcement}
      </p>

      {result && !running && (
        <ul className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
          {result.cases.map((c, i) => (
            <li key={i} className="font-mono text-xs leading-5">
              <span aria-hidden="true" className={c.passed ? "text-green-700" : "text-red-700"}>
                {c.passed ? "✓" : "✗"}
              </span>{" "}
              <span className="sr-only">{c.passed ? "Passed: " : "Failed: "}</span>
              <span className="text-neutral-800">
                {functionName}({c.args})
              </span>
              {!c.passed && (
                <span className="ml-4 block text-neutral-700">
                  <span className="block">expected: {c.expected}</span>
                  {c.error ? (
                    <span className="block text-red-700">error: {c.error}</span>
                  ) : (
                    <span className="block">got: {c.actual}</span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
