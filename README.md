# next-js-notes-app

A full-stack notes app built for a software-engineering assignment: a signed-in user creates, edits, tags, searches, filters, and deletes their own notes.

**Stack:** Next.js 16 (App Router) · TypeScript · better-auth · Drizzle ORM · PostgreSQL 18 · Tailwind CSS v4 · shadcn/ui · Bun · Turborepo · Vitest

**Live URL:** https://njnapp.onrender.com (Render web service from Docker Hub image `aivalacoder/next-js-notes-app:latest`)

---

## Test account (for the evaluator)

|          |                     |
| -------- | ------------------- |
| Email    | `demo@notesapp.dev` |
| Password | `DemoPass123!`      |

Seed it after deploy (see [Deployment](#deployment)) or locally with `bun run seed`.

---

## Features

- **Auth** — signup/signin/signout with email+password; passwords hashed with bcryptjs (2a rounds); session cookie httpOnly; route-guard middleware + per-page re-validation.
- **Notes CRUD** — create, edit, delete; ownership enforced server-side (cross-user access returns 404, no existence leak).
- **Tags** — assign multiple tags per note; typing a tag name implicitly creates it (trimmed + lowercased, unique per user); autocomplete from your existing tags.
- **Filter / sort / search** — multi-tag AND filter, case-insensitive title search (ILIKE, wildcards escaped), newest/oldest sort; all combined in one server query. Filters live in client state (search debounced 300ms) so nothing round-trips through the URL — kept deliberately simple, no shareable/back-button URL state (a known tradeoff).

## Run locally

Prerequisites: [Bun](https://bun.sh), [Docker](https://www.docker.com/).

```bash
bun install          # install dependencies
bun run db:start     # start the local Postgres (docker compose)
cp apps/web/.env.example apps/web/.env   # if not already present; adjust as needed
bun run db:migrate   # apply schema migrations to the dev DB
bun run dev:web      # start the app at http://localhost:3001
```

Useful scripts: `npm run test` (test suite — requires the Postgres container running), `bun run check-types`, `npm run lint`, `bun run db:generate`, `bun run db:studio`.

## Database schema & why

Migrated with Drizzle (`packages/db/src/migrations/`), applied at deploy via a bundled runner (`scripts/db-migrate.ts`).

| Table                                        | Purpose                         | Why it looks like this                                                                                                                                               |
| -------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`, `session`, `account`, `verification` | better-auth session/auth tables | standard better-auth PostgreSQL schema                                                                                                                               |
| `notes`                                      | a user's note (title + body)    | `userId` FK with `ON DELETE CASCADE` + index; ownership scoping lives on every query, so a note id never reveals whether another user's note exists (404 either way) |
| `tags`                                       | a user's tag vocabulary         | `UNIQUE (userId, name)` — one tag row per user per name, so implicit creation is race-safe (`ON CONFLICT DO NOTHING` + re-select)                                    |
| `note_tags`                                  | note ↔ tag many-to-many join    | `UNIQUE (noteId, tagId)`; assignment is wholesale-replaced (delete + insert) inside a transaction                                                                    |

Timestamps are `timestamptz` with DB-side defaults. Migrations are sequential SQL files + a `meta/` journal read by the migrator.

## API

All routes require a session cookie; errors are structured `{ "message": "..." }` with proper status codes (401/400/404).

| Method           | Path             | Behavior                                          |
| ---------------- | ---------------- | ------------------------------------------------- |
| GET/POST         | `/api/notes`     | List (filters: `q`, `tags` AND, `dir`) / create   |
| GET/PATCH/DELETE | `/api/notes/:id` | Read / partial update / delete — 404 if not owned |
| GET              | `/api/tags`      | Current user's tags (filter UI + autocomplete)    |
| POST             | `/api/auth/*`    | better-auth signup/signin/signout/session         |

## Testing

Vitest integration tests run **in-process against real Postgres** (a separate `notes_app_test` database, migrations applied by global setup, tables truncated between suites). Tests were written **before** the implementation for each feature (TDD):

```bash
npm run test   # 33 tests — auth, ownership 404s, notes CRUD, tags, filters
```

Covered suites (spec §6): auth flows (signup/signin/signout, bcrypt prefix visible, duplicate email), ownership enforcement (cross-user GET/PATCH/DELETE → 404, data intact), filter/sort/search (multi-tag AND, ILIKE title-only, asc/desc, combined query), malformed JSON → 400, LIKE-wildcard literal matching.

## Tradeoffs & shortcuts (honest account)

- **oxlint instead of ESLint + Prettier.** The assignment asks for ESLint+Prettier; the scaffold ships oxlint/oxfmt as the lint & format tooling. `npm run lint` passes via the oxlint alias. Documented rather than silently substituted.
- **Note body is plain text.** Stored and rendered as-is (no markdown rendering, no rich text). Matches the spec's plain-textarea requirement; a read-only view using `whitespace-pre-wrap` is a listed future improvement.
- **Tags created implicitly on assignment.** Typing a new tag name in the editor creates it for the user (per spec). Tags are never shared across users.
- **404 hides existence.** Cross-user access returns 404 (not 403) so an attacker can't probe which note ids exist.
- **Multi-tag filter is AND-only.** Matches the spec; OR-matching would be a trivial query tweak but wasn't asked for.
- **Autocomplete uses a native `<datalist>`.** Functionally correct and dependency-free; a styled/fully keyboard-operable combobox is a future improvement.
- **Search debounces (300ms) client-side**, then round-trips through the URL; server does the authoritative filtering.

## Future improvements

- Accessibility pass (axe + keyboard walkthrough + Lighthouse) — deferred by design decision, tracked in `.scratch/notes-app-build/issues/06-a11y-pass.md`.
- Relative timestamps ("2m ago") in the note list; mobile editor back-link navigation.
- Zod schema unit tests (currently covered indirectly by integration tests).
- Pagination for large note counts; tag rename/merge; note body preview (markdown).

## How AI tools were used

This project was built in an agentic coding loop (OpenAI Codex / opencode CLI):

- **Spec → tickets:** the assignment spec was decomposed into a build queue of 7 tickets (`.scratch/notes-app-build/issues/`), each with acceptance criteria.
- **TDD per ticket:** tests were written first (against real Postgres via Vitest), then implementation, then the suite kept green (33 tests).
- **Two-axis code review:** after each ticket, two review passes ran — one checking the code against the spec, one against repo standards — and findings were fixed in follow-up commits.
- **Human decisions at each gate:** ticket scope, schema shape, deferring the a11y ticket, GitHub account, and the deploy approach (Docker Hub → Render web service) were decided by the author, not the AI.
- Full conversation records live in the Codex/opencode session logs; the repo history shows the incremental commit trail (feature commits + review-fix commits per ticket).

## Deployment

Two working paths; **the one used for this deployment is the Docker Hub image** (option B).

### A. Render Blueprint (one-click, `render.yaml` at repo root)

1. Push this repo to GitHub (public).
2. Render dashboard → **New → Blueprint** → pick the repo. Render reads `render.yaml`: managed Postgres (`basic-256mb`, free tier — **expires after 30 days**) + Docker web service.
3. Set the three `sync: false` env vars in the service: `BETTER_AUTH_URL` and `CORS_ORIGIN` = `https://<your-service>.onrender.com`, and a `BETTER_AUTH_SECRET` (any random string ≥ 32 chars).
4. Migrations run automatically via `preDeployCommand` (`node db-migrate.mjs` — bundled drizzle + pg, migrations copied into the image).

### B. Docker Hub image → Render web service (used here)

1. Build & publish the image:

   ```bash
   docker login                # your Docker Hub account
   docker build -t <dockerhub-user>/next-js-notes-app:latest .
   docker push <dockerhub-user>/next-js-notes-app:latest
   ```

2. Render dashboard → **New → Web Service** → pick the image from **Docker Hub**.
3. **Create a Postgres instance** (Render → New → Postgres, free tier) and copy its **Internal connection string**.
4. In the web service, set env vars:
   - `DATABASE_URL` = the Postgres internal connection string
   - `BETTER_AUTH_URL` = `https://<your-service>.onrender.com`
   - `CORS_ORIGIN` = `https://<your-service>.onrender.com`
   - `BETTER_AUTH_SECRET` = any random string ≥ 32 chars
5. **Advanced → Pre-deploy command:** `node db-migrate.mjs` (the image contains the bundled migrator + migration files).
6. Deploy, then seed the test account once the site is live:

   ```bash
   BETTER_AUTH_URL=https://<your-service>.onrender.com bun run seed
   ```

7. Verify: sign in with the test account above; create/edit/delete a note; add/remove tags; search, filter, and sort.
