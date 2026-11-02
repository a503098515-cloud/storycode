# ADR-0012: Username/password authentication

## Status

Accepted

## Context

The login experience needs real credentials rather than the previous
passwordless identity stub. The auth spec previously described GitHub OAuth as
the future provider, but the requested sign-in flow is username/password.
Identity must remain derived from a server-verified session, not a client
supplied user id.

## Decision

- Normalize usernames to lowercase and enforce a 3–32 character
  letters/digits/underscore format.
- Create an account on first use of an unused username; require its password
  for later sign-ins.
- Store passwords as salted scrypt hashes.
- Issue random opaque session tokens, store only their SHA-256 hashes in the
  database, and use secure, HTTP-only, same-site cookies.
- Resolve each request's user from an unexpired database session.

This supersedes the planned GitHub OAuth provider and unsigned identity
approach in ADR-0003; it does not change the `currentUserId()` call-site
contract.

## Consequences

- **Easier**: the app can authenticate users without an OAuth provider or
  external account.
- **Harder**: account recovery, username changes, and password reset are not
  available; sessions require a database lookup.
- **Accepted tradeoff**: account creation happens on first sign-in, so there
  is no separate registration flow.

## See also

- `docs/specs/auth.md` — the current credential and session behavior.
- `docs/adr/0003-dev-identity-stub.md` — the prior identity stub decision.
