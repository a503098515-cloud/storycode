// Re-exports the auth/identity layer. Currently email-only sign-in with an
// unsigned session cookie — identity without authentication. Real auth
// replaces the inside of this package; the call sites don't change.
export { currentUserId, startSession, endSession, SESSION_COOKIE } from "./current-user";
