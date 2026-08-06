# 01 — Build harness

**What to build:** `npm run test` and `npm run lint` run green from the repo root. Test setup: Vitest with a real Postgres test database (same docker-compose service, separate DB, migrations applied, tables truncated between tests). Lint: oxlint backed by a root `npm run lint` alias via turbo, as decided in the spec (lint-strategy decision — oxlint/oxfmt kept, ESLint/Prettier substitution documented in README).

**Blocked by:** None — can start immediately.

# 01 — Build harness

**Status:** ready-for-agent

- [x] Root `npm run test` exists and runs a Vitest suite against Postgres
- [x] Root `npm run lint` exists and passes (oxlint)
- [x] A trivial placeholder test runs green against the test DB
- [x] README notes the lint substitution

## Done

Vitest 4 at repo root (`vitest.config.ts` + `tests/global-setup.ts` auto-creates `notes_app_test` DB; `tests/harness.test.ts` smoke test). Root `test: vitest run`, `lint: oxlint`. README Testing + Lint sections. Fixed 3 pre-existing scaffold lint errors (schema/index empty export, env/web unused `z`, dashboard unused `session`). All checks green.

Deferred to later tickets (recorded so b07 doesn't rediscover them): **migrations + truncation** land with the schema ticket (no migrations dir exists yet — harness only creates the DB); **turbo-run** backing for `lint`/`test` dropped deliberately (no workspace package defines those scripts yet, so turbo would no-op; revisit when per-package scripts exist). Test env plumbing: `vitest.config.ts` loads `apps/web/.env`; global setup derives `TEST_DATABASE_URL` from `DATABASE_URL`.

Source: `.scratch/notes-app/spec.md` §6 (testing), §8 (lint).
