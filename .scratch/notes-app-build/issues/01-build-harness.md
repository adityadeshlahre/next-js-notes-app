# 01 — Build harness

**What to build:** `npm run test` and `npm run lint` run green from the repo root. Test setup: Vitest with a real Postgres test database (same docker-compose service, separate DB, migrations applied, tables truncated between tests). Lint: oxlint backed by a root `npm run lint` alias via turbo, as decided in the spec (lint-strategy decision — oxlint/oxfmt kept, ESLint/Prettier substitution documented in README).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Root `npm run test` exists and runs a Vitest suite against Postgres
- [ ] Root `npm run lint` exists and passes (oxlint)
- [ ] A trivial placeholder test runs green against the test DB
- [ ] README notes the lint substitution

Source: `.scratch/notes-app/spec.md` §6 (testing), §8 (lint).