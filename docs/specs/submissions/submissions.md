---
type: feature
---
# Submissions API accepts code submissions and returns user submission history

## Why
Users need to submit their code solutions for coding levels and view their submission history to track their progress.

## Where it lives
- `packages/domain/src/schemas/submission.ts` — Zod validation schema (`CreateSubmission`) and TypeScript types.
- `packages/domain/src/queries/submissions.ts` — User-scoped database query functions (`listSubmissions`, `createSubmission`, `getSubmissionById`).
- `apps/web/app/api/submissions/route.ts` — API route handlers for `GET` (list) and `POST` (create).
- `apps/web/app/api/submissions/[submissionId]/route.ts` — API route handler for `GET` (single submission detail).

## Behavior
- `GET /api/submissions` returns all submissions created by the authenticated user.
- `POST /api/submissions` creates a submission record for the authenticated user when valid `levelId` and `codeSubmitted` fields are provided.
- `GET /api/submissions/[submissionId]` returns a single submission if it belongs to the authenticated user.
- Requests without a valid session return `401 UNAUTHENTICATED`.
- Requests with invalid JSON or missing schema fields return `400 BAD_JSON` or `400 VALIDATION_ERROR`.
- Querying a submission owned by a different user returns `404 NOT_FOUND` to prevent resource existence disclosure (never `403`).

## Examples

| State / input | Behavior |
|---|---|
| Signed-out request (`GET /api/submissions`) | Returns `401 UNAUTHENTICATED` |
| Signed-in (`GET /api/submissions`) | Returns `200 OK` with user's submissions list |
| Signed-in (`POST /api/submissions` with valid payload) | Creates submission and returns `200 OK` |
| Signed-in (`POST /api/submissions` with `{}`) | Returns `400 VALIDATION_ERROR` |
| Signed-in (`POST /api/submissions` with invalid JSON) | Returns `400 BAD_JSON` |
| Signed-in (`GET /api/submissions/[submissionId]` owned by another user) | Returns `404 NOT_FOUND` |

## Verify
- Run schema tests from root:
  `pnpm test`
- Manual drill with dev server running (`pnpm dev`):
  1. Unauthenticated check: `curl -s localhost:3000/api/submissions`
  2. User list check: `curl -s http://localhost:3000/api/submissions -b "session=user_123"`
  3. Stranger check: `curl -s http://localhost:3000/api/submissions/[submissionId] -H "Cookie: session=someone-else"` (must return `404`)

## Constraints & decisions
- Foreign resource access returns `404 NOT_FOUND` instead of `403 FORBIDDEN` to prevent revealing submission existence to unauthorized users.
- Submissions are write-once/read-only; updating or deleting existing submission records is intentionally prohibited.

## Out of scope
- Code execution and evaluation logic (handled by isolated submission runners outside this API).
- Pagination and query-string filtering on submission lists.

## UI states

```mermaid
stateDiagram-v2
  [*] --> empty: Initial state
  empty --> ready: User inputs code
  ready --> empty: Clear code
  ready --> submitting: Click submit button
  submitting --> success: API 201 response
  success --> empty: Reset form state
  submitting --> error: 400 validation error or network failure
  error --> submitting: Retry submit button
  error --> ready: Edit code content