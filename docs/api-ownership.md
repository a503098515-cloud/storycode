# API Ownership Split

| Teammate | Role | Ownership | Endpoints |
| --- | --- | --- | --- |
| Osei Boakye | 1. Identity and profile  | Session, current user, and profile reads or updates | `POST /api/auth/login`<br>`POST /api/auth/logout`<br>`GET /api/me` |
| Karthikeya| 2. Level catalog | Read-only story and coding challenge content | `GET /api/levels`<br>`GET /api/levels/:levelId` |
| jiarong kong | 3. Submissions | Create and list the signed-in user's code submissions | `POST /api/submissions`<br>`GET /api/submissions`<br>`GET /api/submissions/:submissionId` |
| AJ | 4. Progression and integration | Current level, completion rules, cross-entity behavior, and API contract tests | `GET /api/progress`<br>`PATCH /api/progress/current-level` |

## Shared Boundaries

- No endpoint accepts `userId`; derive it through `currentUserId()`.
- Submission queries always filter by the current user.
- Foreign or unknown resources return `404`, never `403`.
- Level reads are available to signed-in users; submission history is user-scoped.
- If a passing submission updates progression, the submission and progression update happen in one transaction.
- Teammate 4 owns integration tests for the full flow: sign in, list levels, submit code, and update progress.

## Coordination Notes

`User.currentLevelId` is currently a nullable string rather than a Prisma relation to `Level`. Before implementing progression endpoints, decide whether to make it a proper relation or introduce a separate progress model.

The current domain query split is in `packages/domain/src/queries/users.ts` and `packages/domain/src/queries/levels.ts`. Route handlers should follow the server-entry contract in `docs/specs/web.md`:

1. Derive identity.
2. Validate with the shared Zod schema.
3. Query using the derived user.
4. Act.
5. Map errors to the standard error shape.
6. Revalidate when needed.
