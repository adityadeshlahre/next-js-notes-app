# 07 — Deploy & deliverables

**What to build:** Ship the app on Render, hand the evaluator everything the assignment asks for: a `render.yaml` Blueprint that deploys the Dockerized Next.js app with managed Postgres (migrations run pre-deploy), env vars wired, a seeded test account, a public GitHub repo, and a README documenting run-locally, the schema, tradeoffs, test approach, future improvements, and AI-tool usage.

**Blocked by:** `#05` (feature-complete before deploy), plus Lighthouse gate in #06

**Status:** ready-for-agent

**Acceptance criteria**

- [x] `render.yaml` Blueprint: web service (Docker) + Postgres
- [x] Live URL fully functional: auth, notes, tags, filtering in production — **verified 2026-08-06**: `https://njnapp.onrender.com/` 200 (new landing), sign-in/email 200 + `__Secure-better-auth.session_token` cookie, `/dashboard` with cookie 200, `/api/notes` 200, freshly signed-in demo cookies round-trip dashboard. Demo account `demo@notesapp.dev` / `DemoPass123!` sign-in + dashboard verified live (curl). One P0 tracked post-review: stale/invalid session cookie deadlocks sign-in — fixed server-side (stale cookie stripped in auth route handler) + client 403→dashboard redirect; not yet re-verified live after deploy.
- [x] Migrations run on deploy (pre-deploy step)
- [x] Test account seeded (email/password), documented for the evaluator — **verified live 2026-08-06**: `bun run seed` against the deployed DB; sign-in with `demo@notesapp.dev` / `DemoPass123!` returns 200 fresh + `/dashboard` 200 with the resulting cookie. Seed step is manual (free tier has no pre-deploy hook); only migrations auto-run (`preDeployCommand: node db-migrate.mjs`).
- [x] GitHub public repo created and pushed (repo currently has no remote)
- [x] README: run locally, DB schema + why, tradeoffs/shortcuts (incl. lint substitution, plaintext body), testing approach + TDD, future improvements, AI usage

## Comments

- Deploy path decided: **Docker Hub image → Render web service** (user preference; render.yaml blueprint also provided for the alternative). Image: `aivalacoder/next-js-notes-app:latest` (digest `sha256:3dc4f15...`, pushed 2026-08-06; always-tag `latest`, no versioned tags kept).
- Dockerfile: builder stage now bundles `scripts/db-migrate.ts` (drizzle migrator + pg) into `db-migrate.mjs` + copies `packages/db/src/migrations/` into the runner image; `preDeployCommand: node db-migrate.mjs` runs migrations against the managed DB (verified locally: bundled script applied migrations idempotently against the test DB).
- GitHub repo: `https://github.com/adityadeshlahre/next-js-notes-app` (public, master). Pushed over HTTPS (gh credential helper) after SSH key mismatch.
- Fixed during Docker build: typed-routes TS2345 in `pushParams` (dynamic href) — cast via `Route` type.
- README: full deliverable rewrite (run-locally, schema + why, API table, testing/TDD, tradeoffs, future improvements, honest AI-usage account, both deploy paths + seed steps). Test account `demo@notesapp.dev` / `DemoPass123!` seeded via `bun run seed`.
- Service created (user, Render dashboard): web service `njnapp.onrender.com` from Docker Hub image, free tier; env `DATABASE_URL` (internal conn string), `BETTER_AUTH_URL`/`CORS_ORIGIN` = `https://njnapp.onrender.com`, `BETTER_AUTH_SECRET`; CMD runs `node db-migrate.mjs && node apps/web/server.js`; demo account seeded manually via `bun run seed`. REMAINING: re-verify stale-cookie fix live post-deploy (see AC note above).

Sources: `.scratch/notes-app/spec.md` §7 (deploy), §10 (deliverables); wayfinder tickets `render-deploy`.
