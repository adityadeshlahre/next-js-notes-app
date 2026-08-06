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

## Not yet specified

- Precise DDL (columns, constraints, indexes) — graduates from note-model and tag-model tickets.
- Validation layer layout (where Zod schemas live, shared vs per-route) — graduates from api-layer.
- File/folder structure for the app (routes, components, lib) — graduates from api-layer and ui-layout.
- Test-data strategy (seeds, fixtures, test DB lifecycle) — graduates from test-strategy.
- Render service config details (service name, region, healthcheck) — graduates from render-deploy.
- Deliverables execution plan (README structure, repo creation, test account seeding) — graduates from spec-consolidation.

## Out of scope

- Anything beyond ASSIGNMENT.md's feature list: roles/permissions, email verification, password reset flows, pagination, real-time collaboration, rich text beyond plaintext body (until a ticket rules otherwise).
