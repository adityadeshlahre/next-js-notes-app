# Notes App — wayfinder map

## Destination

A decision-complete **implementation spec** for the ASSIGNMENT.md Notes app (auth, notes, tags, filtering, testing, a11y, Render deployment, deliverables) — every open decision resolved, the spec ready to hand off to a build session. Plan-only: this map produces the spec, not the build.

## Notes

- Domain: full-stack Notes app — Next.js 16 App Router (turbo monorepo), better-auth, Drizzle + Postgres 18 (docker-compose), shadcn/ui, Bun. Scaffold stack is settled, not re-decided.
- Deploy target: **Render** (Docker). GitHub repo created at deliverables time (repo currently has no remote).
- Standing preference: **question-driven development** — every grilling ticket is asked to the user with a recommended answer first; never resolve a decision on the user's behalf.
- Skills each session should consult: `grilling`/`domain-modeling` (decisions), `research` (AFK), `prototype` (UI), `web-design-guidelines` (a11y), `tdd` (testing approach), `better-auth-best-practices`, `shadcn`.
- Tracker: local-markdown (`.scratch/`), wayfinding conventions per `docs/agents/issue-tracker.md`. No branches — work in place on master.
- Research ticket findings are recorded directly into the ticket's `## Answer` (no throwaway branches).

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [password-hash](issues/03-password-hash.md) — switch better-auth to bcryptjs via `emailAndPassword.password.{hash,verify}`; no schema change, no migration risk.
- [render-deploy](issues/11-render-deploy.md) — render.yaml blueprint, docker runtime, `fromDatabase` internal URL, preDeployCommand migrations, existing Dockerfile reused as-is.
- [api-layer](issues/01-api-layer.md) — REST route handlers under `app/api/*` for notes/tags CRUD; unblocks test-strategy.
- [lint-strategy](issues/02-lint-strategy.md) — keep oxlint/oxfmt, add a `npm run lint` alias via turbo; README documents the ESLint/Prettier substitution.
- [route-guard](issues/04-route-guard.md) — middleware cookie guard via `getSessionCookie` + per-page `getSession` re-check; single redirect to /login.
- [note-model](issues/05-note-model.md) — id/userId/title/body/timestamps; session-scoped queries, 404-hide on cross-user, hard delete, PATCH semantics; unblocks tag-model.
- [tag-model](issues/06-tag-model.md) — private per-user tags (trimmed/lowercased, unique per user) + `note_tags` join; implicit creation on assign; no standalone tag CRUD.
- [filter-sort-search](issues/07-filter-sort-search.md) — AND semantics for multi-tag, ILIKE title search, createdAt sort, all state in URL search params, single server query.
- [note-editor-format](issues/08-note-editor-format.md) — plain textarea + `whitespace-pre-wrap` rendering, zero deps; unblocks ui-layout.
- [ui-layout](issues/09-ui-layout.md) — approved three-column dashboard sketch (`prototypes/ui-layout.md`): URL-driven state, tag chips + autocomplete, Cmd/Ctrl+S, AlertDialog delete, responsive stack.
- [test-strategy](issues/10-test-strategy.md) — Vitest + real Postgres (separate test DB), in-process route-handler integration tests covering auth/ownership/filter-sort; TDD on critical paths.
- [a11y-pass](issues/12-a11y-pass.md) — axe-core assertions in Vitest per page + a11y baked into features; manual Lighthouse pass as pre-deploy release gate.
- [spec-consolidation](issues/13-spec-consolidation.md) — **spec written** (`spec.md`): schema, API contract, UI, tests, Render deploy, deliverables — map destination reached.

## Not yet specified

<!-- the fog has cleared — all patches graduated into `spec.md` (see Decisions so far, spec-consolidation) -->

## Out of scope

- Anything beyond ASSIGNMENT.md's feature list: roles/permissions, email verification, password reset flows, pagination, real-time collaboration, rich text beyond plaintext body (until a ticket rules otherwise).
