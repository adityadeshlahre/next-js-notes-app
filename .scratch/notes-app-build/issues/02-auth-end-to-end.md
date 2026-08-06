# 02 — Auth end-to-end

**What to build:** A user can sign up with email + password, sign in, and sign out. Passwords are hashed with bcryptjs. `/dashboard` (and any protected route) redirects unauthenticated users to `/login`. Middleware cookie guard + per-page session re-check per the route-guard decision.

**Blocked by:** 01 (build harness)

**Status:** ready-for-agent

- [x] Sign up creates a user with bcryptjs-hashed password
- [x] Sign in/logged-in session persists via httpOnly cookies
- [x] Sign out clears the session
- [x] Unauthenticated visit to `/dashboard` redirects to `/login`
- [x] Integration tests cover signup, signin, signout
- [x] Test asserts password stored is bcryptjs, not plaintext

## Comments

- 2026-08-06: Implemented (commit 65ef982). All checks green; review findings fixed (commit pending): proxy-level redirect test, sign-out via HTTP route test, forged-cookie re-check test, shared test-DB URL derivation (`tests/test-env.ts`), test helpers to dedupe signup blocks, cookie-name constant.
- Note: the auth schema migration (`packages/db/src/migrations/0000_ordinary_hex.sql`) is the first migration in the repo — it materializes the scaffold's existing schema so the test DB can be migrated in global-setup; no runtime schema change.

Source: `.scratch/notes-app/spec.md` §2 (auth); wayfinder tickets `password-hash`, `route-guard`.
