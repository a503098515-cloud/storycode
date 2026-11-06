import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RunResult } from "@project/domain/challenge";
import { TestResults } from "@/components/TestResults";

// SubmissionForm's editor (CodeMirror) and worker runner need a real
// browser; stand them in so the form's own behavior can be tested in jsdom.
vi.mock("@/components/CodeEditor", () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Your Solution" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock("@/lib/run-in-worker", () => ({ runInWorker: vi.fn() }));

const { SubmissionForm } = await import("@/components/SubmissionForm");
const { runInWorker } = await import("@/lib/run-in-worker");

afterEach(cleanup);

const oneOfThree: RunResult = {
  passed: false,
  cases: [
    { passed: true, args: '"Ada"', expected: '"Hello, Ada!"', actual: '"Hello, Ada!"' },
    { passed: false, args: '"Grace"', expected: '"Hello, Grace!"', actual: '"Hi Grace"' },
    { passed: false, args: '"World"', expected: '"Hello, World!"', error: "Error: nope" },
  ],
};

const greetTests = {
  functionName: "greet",
  cases: [
    { args: ["Ada"], expected: "Hello, Ada!" },
    { args: ["Grace"], expected: "Hello, Grace!" },
    { args: ["World"], expected: "Hello, World!" },
  ],
};

describe("TestResults", () => {
  it("keeps one live region from the first render and announces into it", () => {
    const { rerender } = render(<TestResults running={false} result={null} functionName="greet" />);
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");

    rerender(<TestResults running result={null} functionName="greet" />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toBe("Running tests…");

    rerender(<TestResults running={false} result={oneOfThree} functionName="greet" />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toBe("1 of 3 tests passed.");
  });

  it("states pass/fail in text for each case, not only with an icon", () => {
    render(<TestResults running={false} result={oneOfThree} functionName="greet" />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent?.replace(/^[✓✗]\s*/, ""))).toEqual([
      'Passed: greet("Ada")',
      'Failed: greet("Grace")expected: "Hello, Grace!"got: "Hi Grace"',
      'Failed: greet("World")expected: "Hello, World!"error: Error: nope',
    ]);
  });
});

describe("SubmissionForm test feedback", () => {
  it("keeps focus on Run tests while running, then announces the result", async () => {
    let finish!: (r: RunResult) => void;
    vi.mocked(runInWorker).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SubmissionForm levelId="lvl1" starterCode="function greet() {}" challengeTests={greetTests} />);

    const runButton = screen.getByRole("button", { name: "Run tests" });
    const results = screen.getAllByRole("status").at(-1)!;
    runButton.focus();
    fireEvent.click(runButton);

    // Busy, but still focusable: aria-disabled, never native disabled.
    expect(runButton).toBe(document.activeElement);
    expect(runButton).not.toHaveProperty("disabled", true);
    expect(runButton.getAttribute("aria-disabled")).toBe("true");
    expect(results.textContent).toBe("Running tests…");

    await act(async () => finish(oneOfThree));

    expect(runButton).toBe(document.activeElement);
    expect(runButton.getAttribute("aria-disabled")).toBeNull();
    expect(screen.getAllByRole("status").at(-1)).toBe(results);
    expect(results.textContent).toBe("1 of 3 tests passed.");
  });

  it("puts the results after the buttons in reading order", async () => {
    vi.mocked(runInWorker).mockResolvedValue(oneOfThree);
    render(<SubmissionForm levelId="lvl1" starterCode="function greet() {}" challengeTests={greetTests} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Run tests" })));

    const submit = screen.getByRole("button", { name: "Submit Solution" });
    const list = screen.getByRole("list");
    expect(submit.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("announces a plain-language error when the network is down, focus stays on Submit", async () => {
    vi.mocked(runInWorker).mockResolvedValue(oneOfThree);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<SubmissionForm levelId="lvl1" starterCode="function greet() {}" challengeTests={greetTests} />);
    const submit = screen.getByRole("button", { name: "Submit Solution" });
    const formStatus = screen.getAllByRole("status")[0];
    submit.focus();
    await act(async () => fireEvent.click(submit));

    expect(formStatus.textContent).toBe("Network request failed, please check your connection");
    expect(submit).toBe(document.activeElement);
    vi.unstubAllGlobals();
  });

  it("clears results silently when the code is edited", async () => {
    vi.mocked(runInWorker).mockResolvedValue(oneOfThree);
    render(<SubmissionForm levelId="lvl1" starterCode="function greet() {}" challengeTests={greetTests} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Run tests" })));
    const results = screen.getAllByRole("status").at(-1)!;
    expect(results.textContent).toBe("1 of 3 tests passed.");

    fireEvent.change(screen.getByRole("textbox", { name: "Your Solution" }), { target: { value: "x" } });
    expect(results.textContent).toBe("");
    expect(screen.queryByRole("list")).toBeNull();
  });
});
