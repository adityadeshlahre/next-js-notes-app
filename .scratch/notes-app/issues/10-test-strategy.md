# 10 — Test strategy

Type: grilling
Status: resolved
Blocked by: 01

## Question

What test stack and integration approach satisfy "TDD approach, `npm run test` must pass"?

Options:

- **Vitest + supertest-style in-process requests against route handlers with a real Postgres (docker-compose)** (recommended): fast, covers auth flows + ownership + filtering as integration tests, runs in CI with the same Postgres as dev.
- **Vitest + in-memory (better-sqlite/msql)**: no docker dependency but less faithful to Postgres (ILIKE, joins behave differently).
- **Jest + running dev server + curl**: slowest, flaky, least reliable.
- Runner placement: root-level script (`npm run test` via turbo) — required by the assignment literally.

Also decide: unit tests (validation logic) + integration tests (auth flows, ownership enforcement, filter/sort logic) — which paths are mandatory per ASSIGNMENT.md.

## Answer

**Vitest + real Postgres.** Vitest at repo root, `npm run test` via turbo (required literally). Integration tests invoke route handlers in-process (api-layer decision makes this trivial) against a real Postgres — same docker-compose service, separate `notes_app_test` database, migrated per run. Mandatory coverage per ASSIGNMENT.md: signup/signin/signout flows; ownership enforcement (cross-user read/edit/delete → 404); filter (multi-tag AND), sort, and search logic; Zod validation unit tests. Truncate tables between tests. TDD: tests written first for each of these critical paths.
