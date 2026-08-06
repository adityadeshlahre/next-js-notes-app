# 07 — Deploy & deliverables

**What to build:** Ship the app on Render, hand the evaluator everything the assignment asks for: a `render.yaml` Blueprint that deploys the Dockerized Next.js app with managed Postgres (migrations run pre-deploy), env vars wired, a seeded test account, a public GitHub repo, and a README documenting run-locally, the schema, tradeoffs, test approach, future improvements, and AI-tool usage.

**Blocked by:** `#05` (feature-complete before deploy), plus Lighthouse gate in #06

**Status:** ready-for-agent

**Acceptance criteria**

- [x] `render.yaml` Blueprint: web service (Docker) + Postgres
- [ ] Live URL fully functional: auth, notes, tags, filtering in production
- [x] Migrations run on deploy (pre-deploy step)
- [x] Test account seeded (email/password), documented for the evaluator
- [x] GitHub public repo created and pushed (repo currently has no remote)
- [x] README: run locally, DB schema + why, tradeoffs/shortcuts (incl. lint substitution, plaintext body), testing approach + TDD, future improvements, AI usage

## Comments

- Deploy path decided: **Docker Hub image → Render web service** (user preference; render.yaml blueprint also provided for the alternative). Image: `aivalacoder/next-js-notes-app:latest` (digest `sha256:3dc4f15...`, pushed 2026-08-06; always-tag `latest`, no versioned tags kept).
- Dockerfile: builder stage now bundles `scripts/db-migrate.ts` (drizzle migrator + pg) into `db-migrate.mjs` + copies `packages/db/src/migrations/` into the runner image; `preDeployCommand: node db-migrate.mjs` runs migrations against the managed DB (verified locally: bundled script applied migrations idempotently against the test DB).
- GitHub repo: `https://github.com/adityadeshlahre/next-js-notes-app` (public, master). Pushed over HTTPS (gh credential helper) after SSH key mismatch.
- Fixed during Docker build: typed-routes TS2345 in `pushParams` (dynamic href) — cast via `Route` type.
- README: full deliverable rewrite (run-locally, schema + why, API table, testing/TDD, tradeoffs, future improvements, honest AI-usage account, both deploy paths + seed steps). Test account `demo@notesapp.dev` / `DemoPass123!` seeded via `bun run seed`.
- REMAINING (needs user in Render dashboard): create web service from the Docker Hub image + managed Postgres (free tier), set `DATABASE_URL` (internal conn string), `BETTER_AUTH_URL`/`CORS_ORIGIN` = `https://<service>.onrender.com`, `BETTER_AUTH_SECRET` (≥32 chars), pre-deploy command `node db-migrate.mjs`, deploy, run `BETTER_AUTH_URL=... bun run seed`, verify auth/notes/tags/filtering live.

Sources: `.scratch/notes-app/spec.md` §7 (deploy), §10 (deliverables); wayfinder tickets `render-deploy`.
