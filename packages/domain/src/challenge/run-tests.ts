// Grades a player's code against a level's ChallengeTests. Pure and
// synchronous: the caller decides where it runs (a Web Worker in the browser,
// Node in tests) and enforces the time limit — see ADR-0012.
import type { ChallengeTestsInput } from "../schemas/challenge";

export interface CaseResult {
  passed: boolean;
  args: string; // display strings only, so results survive postMessage
  expected: string;
  actual?: string;
  error?: string;
}

export interface RunResult {
  passed: boolean;
  cases: CaseResult[];
}

export function runChallengeTests(code: string, tests: ChallengeTestsInput): RunResult {
  const { functionName } = tests;

  let fn: unknown;
  try {
    // functionName is validated as an identifier, so it is safe to splice in.
    // `typeof` never throws for an undeclared name.
    const factory = new Function(
      `"use strict";\n${code}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`,
    );
    fn = factory();
  } catch (err) {
    return failAll(tests, describeError(err));
  }

  if (typeof fn !== "function") {
    return failAll(tests, `\`${functionName}\` is not defined as a function`);
  }

  const cases = tests.cases.map((testCase): CaseResult => {
    const base = { args: formatArgs(testCase.args), expected: formatValue(testCase.expected) };
    try {
      // Fresh copy so a function that mutates its input can't alter the test.
      const actual = (fn as (...a: unknown[]) => unknown)(...structuredClone(testCase.args));
      return { ...base, passed: deepEqual(actual, testCase.expected), actual: formatValue(actual) };
    } catch (err) {
      return { ...base, passed: false, error: describeError(err) };
    }
  });

  return { passed: cases.every((c) => c.passed), cases };
}

/** Every case fails with one shared message (syntax error, missing function, timeout). */
export function failAll(tests: ChallengeTestsInput, error: string): RunResult {
  return {
    passed: false,
    cases: tests.cases.map((c) => ({
      passed: false,
      args: formatArgs(c.args),
      expected: formatValue(c.expected),
      error,
    })),
  };
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return aKeys.length === bKeys.length && aKeys.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

export function formatValue(value: unknown, depth = 0): string {
  if (depth > 4) return "…";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "function") return "[Function]";
  if (value === null || typeof value !== "object") return String(value);
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v, depth + 1)).join(", ")}]`;
  if (isPlainObject(value)) {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v, depth + 1)}`);
    return entries.length ? `{ ${entries.join(", ")} }` : "{}";
  }
  return Object.prototype.toString.call(value);
}

function formatArgs(args: unknown[]): string {
  return args.map((a) => formatValue(a)).join(", ");
}

function describeError(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : `Thrown: ${formatValue(err)}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
