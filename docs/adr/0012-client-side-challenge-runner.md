# ADR-0012: Challenge code runs in the browser, in a Web Worker

## Status

Accepted

## Context

Coding levels need to run the player's JavaScript against unit tests and say
whether it passes. The code is untrusted. Node's `vm` module is explicitly
not a security boundary. A real server-side sandbox, such as a container or
isolate per run with CPU and memory limits, is a separate service to build,
deploy, and pay for. The submissions spec already leaves code execution out
of scope for the API.

## Decision

Grade in the player's own browser.

- The grader (`runChallengeTests`) is a pure function in `packages/domain`.
  It compiles the code with `new Function` in strict mode and compares return
  values to JSON `expected` values.
- The web app runs it in a fresh, dedicated Web Worker for each run. The
  worker has no DOM access, and the page terminates it after 2 seconds,
  so an infinite loop cannot freeze the page.
- Test cases are JSON data stored on the `Level` row, never code. The server
  never evaluates anything the player wrote.
- The client sends `isPassed` with the submission. The server stores it
  without checking it.

## Consequences

- **Easier**: no new service or infrastructure. Feedback is instant and
  works offline once the page has loaded. The grader is unit-testable in Node.
- **Harder**: `isPassed` can be forged by anyone who calls the API directly,
  and the expected outputs are visible in the network response. That is
  acceptable for a learning game with no leaderboard or rewards. It is not
  acceptable once passing gates anything of value.
- **Accepted tradeoff**: the code runs with the page's origin inside the
  worker. It can call the app's own API as that player, which is the
  player attacking themselves. Running untrusted code from another player
  in this way is not allowed.

## Revisit when

Passing a level unlocks something other players can see (rankings,
certificates, shared progress), or players can run each other's code. At
that point, grading moves to an isolated server-side runner, and this ADR
is superseded.

## See also

- `docs/specs/levels/coding-challenge.md`: the behavior this decision serves.
- [ADR-0009](0009-domain-web-only.md): why the grader lives in `packages/domain`.
