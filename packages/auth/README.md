# @project/auth — username/password authentication

The web app authenticates users with normalized usernames and passwords.
Passwords are stored as salted scrypt hashes. The first sign-in with an unused
username creates an account; subsequent sign-ins verify the stored hash.

Successful sign-in issues a random opaque session token. The database stores
only the SHA-256 token hash, and `currentUserId()` resolves the user from a
non-expired session. The cookie is HTTP-only, same-site, secure in production,
and lasts 30 days.

## Public API

All exports come from `src/index.ts`:

| Export | What it does |
|---|---|
| `currentUserId()` | Returns the signed-in user's id, or `null`. |
| `startSession(userId)` | Creates a database session and sets its cookie. Route Handlers / Server Actions only. |
| `endSession()` | Revokes the current database session and clears its cookie. |
| `hashPassword(password)` | Returns a salted scrypt password hash. |
| `verifyPassword(password, hash)` | Checks a password against its stored hash. |
| `SESSION_COOKIE` | The session cookie name (`"session"`). |

Email-only legacy users do not have a password hash and cannot sign in through
this flow. Password reset and account recovery are not implemented.

## Consumers

- `apps/web` — pages and API routes derive user identity through
  `currentUserId()`.
