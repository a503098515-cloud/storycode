import { describe, expect, it } from "vitest";
import { deepEqual, failAll, runChallengeTests } from "../src/challenge/run-tests";
import type { ChallengeTestsInput } from "../src/schemas/challenge";

const greetTests: ChallengeTestsInput = {
  functionName: "greet",
  cases: [
    { args: ["Ada"], expected: "Hello, Ada!" },
    { args: ["Grace"], expected: "Hello, Grace!" },
    { args: ["World"], expected: "Hello, World!" },
  ],
};

describe("runChallengeTests", () => {
  it("passes every case for a correct solution", () => {
    const result = runChallengeTests('function greet(name) { return "Hello, " + name + "!"; }', greetTests);
    expect(result.passed).toBe(true);
    expect(result.cases.map((c) => c.passed)).toEqual([true, true, true]);
    expect(result.cases[0]).toMatchObject({ args: '"Ada"', expected: '"Hello, Ada!"', actual: '"Hello, Ada!"' });
  });

  it("accepts arrow functions and const declarations", () => {
    const result = runChallengeTests("const greet = (n) => `Hello, ${n}!`;", greetTests);
    expect(result.passed).toBe(true);
  });

  it("fails with expected vs actual when the output is wrong", () => {
    const result = runChallengeTests('function greet(name) { return "Hi " + name; }', greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases[0]).toMatchObject({ passed: false, expected: '"Hello, Ada!"', actual: '"Hi Ada"' });
  });

  it("fails only the cases that are wrong", () => {
    const code = 'function greet(n) { return n === "Ada" ? "Hello, Ada!" : "nope"; }';
    const result = runChallengeTests(code, greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases.map((c) => c.passed)).toEqual([true, false, false]);
  });

  it("reports a thrown error per case", () => {
    const result = runChallengeTests('function greet() { throw new Error("nope"); }', greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases.every((c) => c.error === "Error: nope")).toBe(true);
  });

  it("fails every case with the syntax error", () => {
    const result = runChallengeTests("function greet(name) {", greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases).toHaveLength(3);
    expect(result.cases.every((c) => c.error?.startsWith("SyntaxError"))).toBe(true);
  });

  it("fails every case when the function is not defined", () => {
    const result = runChallengeTests('function hello(name) { return "Hello, " + name + "!"; }', greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases.every((c) => c.error === "`greet` is not defined as a function")).toBe(true);
  });

  it("fails the starter code (empty body returns undefined)", () => {
    const result = runChallengeTests("function greet(name) {\n  // your code here\n}\n", greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases[0].actual).toBe("undefined");
  });

  it("runs in strict mode", () => {
    const code = 'function greet(n) { undeclared = 1; return "Hello, " + n + "!"; }';
    const result = runChallengeTests(code, greetTests);
    expect(result.passed).toBe(false);
    expect(result.cases[0].error).toMatch(/^ReferenceError/);
  });

  it("compares arrays and objects deeply", () => {
    const tests: ChallengeTestsInput = {
      functionName: "pair",
      cases: [{ args: [1, 2], expected: { items: [1, 2], total: 3 } }],
    };
    expect(runChallengeTests("const pair = (a, b) => ({ total: a + b, items: [a, b] });", tests).passed).toBe(true);
    expect(runChallengeTests("const pair = (a, b) => ({ items: [a, b] });", tests).passed).toBe(false);
  });

  it("does not let a mutating solution change the test's args", () => {
    const tests: ChallengeTestsInput = { functionName: "f", cases: [{ args: [[1]], expected: 2 }] };
    const result = runChallengeTests("function f(a) { a.push(9); return a.length; }", tests);
    expect(result.cases[0].args).toBe("[1]");
    expect(tests.cases[0].args).toEqual([[1]]);
  });
});

describe("deepEqual", () => {
  it.each([
    [1, 1, true],
    ["1", 1, false],
    [NaN, NaN, true],
    [[1, [2]], [1, [2]], true],
    [[1, 2], [1, 2, 3], false],
    [{ a: 1 }, { a: 1, b: undefined }, false],
    [null, {}, false],
    [[], {}, false],
  ])("deepEqual(%j, %j) is %s", (a, b, expected) => {
    expect(deepEqual(a, b)).toBe(expected);
  });
});

describe("failAll", () => {
  it("marks every case failed with the shared message", () => {
    const result = failAll(greetTests, "Your code took too long");
    expect(result.passed).toBe(false);
    expect(result.cases.map((c) => c.error)).toEqual(Array(3).fill("Your code took too long"));
  });
});
