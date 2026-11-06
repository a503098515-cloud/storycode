# ADR-0013: Google and GitHub OAuth sign-in

## Status

Accepted

## Context

The login page needs third-party sign-in in addition to the existing
username/password flow. The app already resolves identity from opaque,
database-backed sessions.

## Decision

- Support Google OpenID Connect and GitHub OAuth through server-side
  authorization-code flows with short-lived, HTTP-only state cookies.
- Store provider identities separately from users, keyed by provider and
  stable provider account ID.
- Do not automatically link an OAuth identity to an existing account based
  only on matching email addresses.
- After provider verification, issue the existing database-backed session;
  provider access tokens are not used as app sessions.

## Consequences

- **Easier**: users can use either provider without changing the app's
  identity resolution or session contract.
- **Harder**: provider credentials and callback URLs must be configured for
  each environment; account linking and unlinking are not available.
- **Accepted tradeoff**: the same person may have separate accounts when
  signing in with different providers or existing credentials.

## See also

- `docs/specs/auth.md` — current authentication behavior and provider setup.
- `docs/adr/0012-username-password-auth.md` — username/password credentials.
