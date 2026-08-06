# 02 — Auth end-to-end

**What to build:** A user can sign up with email + password, sign in, and sign out. Passwords are hashed with bcryptjs. `/dashboard` (and any protected route) redirects unauthenticated users to `/login`. Middleware cookie guard + per-page session re-check per the route-guard decision.

**Blocked by:** 01 (build harness)

**Status:** ready-for-human

- [x] Sign up creates a user with bcryptjs-hashed password
- [x] Sign in/logged-in session persists via httpOnly cookies
- [x] Sign out clears the session
- [x] Unauthenticated visit to `/dashboard` redirects to `/login`
- [x] Integration tests cover signup, signin, signout
- [x] Test asserts password stored is bcryptjs, not plaintext

Source: `.scratch/notes-app/spec.md` §2 (auth); wayfinder tickets `password-hash`, `route-guard`.
