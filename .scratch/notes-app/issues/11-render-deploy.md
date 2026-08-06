# 11 — Render deployment shape

Type: research
Status: resolved
Blocked by:

## Question

What is the exact Render deployment shape for this repo?

Research needed:

- **render.yaml Blueprint** (recommended) vs manual web service setup: services, build command, env vars (`DATABASE_URL`, `BETTER_AUTH_URL`, `CORS_ORIGIN`), healthcheck path, Dockerfile usage vs render's native build.
- Managed Postgres provisioning (free tier limits, connection string env wiring).
- The `apps/web/Dockerfile` — does it build standalone in a monorepo (does Render support monorepo root Dockerfile? needs `context: .` / dockerfile path config).
- Auth caveats on Render: `BETTER_AUTH_URL` must be the public URL; any cookie/domain gotchas.

## Answer

**Use a `render.yaml` Blueprint** (reproducible, git-tracked) — one web service + one managed Postgres. Serving via `runtime: docker` with `dockerfilePath: ./apps/web/Dockerfile` and `dockerContext: .` (repo root so the build can COPY packages/). The existing Dockerfile is already monorepo + standalone-ready (next.config standalone output, `HOSTNAME=0.0.0.0` for Render's PORT override) — no adaptation. Wire `DATABASE_URL` via `fromDatabase: { name: notes-db, property: connectionString }` (auto-injects the internal URL). Run migrations via `preDeployCommand` in the runner image (needs drizzle migrator + migration SQL copied in, since drizzle-kit isn't traced to standalone). better-auth: `BETTER_AUTH_URL` = public https URL, `BETTER_AUTH_SECRET` from env, trustedOrigins = CORS_ORIGIN already wired. Free-tier Postgres expires after 30 days.

**Decision: render.yaml blueprint, docker runtime, preDeployCommand migrations, Dockerfile reused as-is.**
Sources: render.com/tutorials/advanced-blueprint-patterns/docker-and-image-runtimes; docs.render.com/monorepo-support; render.com/changelog/predeploy-command; render.com/tutorials/postgres-on-render/connection-strings.
