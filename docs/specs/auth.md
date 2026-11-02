---
type: infrastructure
---
# Identity — the auth subsystem

Who the current user is, and how every server entry learns it.

## Current implementation

- Users sign in with a case-insensitive username (3–32 letters, digits, or
  underscores) and a password (8–128 characters).
- The first sign-in for an unused username creates an account; subsequent
  sign-ins must match its password. Invalid credentials share one response.
- Passwords are stored as salted scrypt hashes, never as plain text.
- Successful sign-in creates a random opaque session token. Only its SHA-256
  hash is stored in the database; the cookie is `httpOnly`, `sameSite=lax`,
  secure in production, and expires after 30 days.
- Every server entry obtains identity through `currentUserId()` in
  `packages/auth/`. It validates the session against the database; the client
  never supplies a user id.
- Email-only legacy users have no password hash and cannot sign in through
  this flow.

## Constraints

- No password reset or account recovery flow is provided.
- Roles/admin, account deletion + export: future work with a privacy doc.

## Key decisions

- [ADR-0003](../adr/0003-dev-identity-stub.md) — the original identity stub.
- [ADR-0012](../adr/0012-username-password-auth.md) — username/password credentials and database sessions.
