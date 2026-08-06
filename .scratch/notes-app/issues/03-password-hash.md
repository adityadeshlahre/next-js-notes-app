# 03 — Password hashing compliance

Type: research
Status: resolved
Blocked by:

## Question

ASSIGNMENT.md: "Passwords must be hashed (bcrypt or argon2)". The scaffold uses better-auth, which defaults to scrypt. What is the minimal way to meet the requirement?

Research needed:

- What hashing better-auth uses by default and how to change it (better-auth supports scrypt options; does it support bcrypt/argon2 out of the box, or via a plugin/custom implementation?).
- Cost/effort of switching (breaking changes to existing users? none yet — no prod users).
- The recommended option: switch to bcrypt or argon2, or keep scrypt and justify in README.

## Answer

Default confirmed: better-auth 1.6.25 hashes with **scrypt** (OWASP-based default). An out-of-the-box switch exists — supply `hash`/`verify` functions to the `emailAndPassword` config (docs ship an argon2 example). Minimal path (~25 lines): a `password.ts` using **bcryptjs** (pure JS, zero deps, built-in TS types) wired as `password: { hash, verify }`. No schema change (hashes live in the existing `account` table), and with zero production users there's no re-hash/legacy-detection complexity. `@node-rs/argon2` was rejected: 2 years stale. Scrypt is defensible but the requirement names bcrypt/argon2 explicitly and the switch is tiny.

**Decision: use bcryptjs.** Sources: better-auth.com/docs/security, better-auth.com/docs/authentication/email-password, better-auth#6608.
