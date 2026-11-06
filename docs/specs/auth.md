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
- Users can also sign in with Google or GitHub. Provider identities are
  stored separately and matched by the provider and stable provider account
  ID; OAuth email addresses do not automatically link accounts.
- OAuth callbacks validate a short-lived, HTTP-only state cookie before
  exchanging the authorization code server-side. Successful OAuth sign-in
  creates the same database-backed session as password sign-in.

## Constraints

- No password reset or account recovery flow is provided.
- OAuth account linking and unlinking are not provided.
- Roles/admin, account deletion + export: future work with a privacy doc.

## OAuth setup

Set `APP_URL` to the canonical app origin and configure
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and
`GITHUB_CLIENT_SECRET` in the web app's environment. Register
`<APP_URL>/api/auth/google/callback` as the Google authorized redirect URI and
`<APP_URL>/api/auth/github/callback` as the GitHub OAuth callback URL. Use
`http://localhost:3000` for local development and HTTPS for production.

## Key decisions

- [ADR-0003](../adr/0003-dev-identity-stub.md) — the original identity stub.
- [ADR-0012](../adr/0012-username-password-auth.md) — username/password credentials and database sessions.
- [ADR-0013](../adr/0013-google-github-oauth.md) — Google and GitHub OAuth sign-in.
