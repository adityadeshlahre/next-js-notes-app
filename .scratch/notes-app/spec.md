# Notes App — Implementation Spec

Destination of the wayfinder map — every decision resolved. Build happens outside the map; this document is the handoff.

Source decisions: `.scratch/notes-app/issues/` (all closed except this one). Stack: Next.js 16 App Router turbo monorepo, better-auth, Drizzle + Postgres 18, shadcn/ui, Bun. Deploy: Render (Docker).

## 1. Schema (Drizzle, packages/db/src/schema)

```ts
// users            — from better-auth (email, name, etc., as scaffolded)
// note_tags join   — unique (noteId, tagId)

notes   : id uuid pk, userId fk→users.id (indexed), title text not null, body text not null default '', createdAt timestamptz, updatedAt timestamptz
tags    : id uuid pk, userId fk→users.id (indexed), name text not null, unique (userId, name)
note_tags: noteId fk→notes.id onDelete cascade, tagId fk→tags.id onDelete cascade, unique (noteId, tagId)
```

- Name normalized: trimmed + lowercased on write.
- Migrations via `drizzle-kit` (already scaffolded).

## 2. Auth (packages/auth)

- better-auth email/password, **bcryptjs** via `emailAndPassword.password.{hash, verify}` (ticket password-hash). Verify uses the same algorithm; hashes stored in the existing `account` table — no schema change.
- Sessions in httpOnly cookies (better-auth default, not localStorage). `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` from env.
- Route protection: single `middleware.ts` — cookie presence via better-auth `getSessionCookie`, redirect to `/login`; each protected page re-validates with `getSession` (ticket route-guard).
- Existing `/login`, `/signup` pages scaffolded with shadcn forms; wire to `signIn.email` / `signUp.email` / `signOut`.

## 3. API contract (REST route handlers — ticket api-layer)

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/notes` | ✓ | List scoped to session user; filters: `tags` (comma list, AND), `q` (ILIKE on title), `sort=createdAt&dir=asc|desc` (default desc) |
| POST | `/api/notes` | ✓ | Create; 400 on invalid body |
| GET | `/api/notes/:id` | ✓ | 404 if not owned (or missing) |
| PATCH | `/api/notes/:id` | ✓ | Partial update (title and/or body); 404 if not owned; 400 invalid |
| DELETE | `/api/notes/:id` | ✓ | Hard delete; 404 if not owned |
| GET | `/api/tags` | ✓ | User's tags (for filter UI + autocomplete) |

- Ownership: every query scoped by session `userId`; cross-user → 404 (no existence leak).
- Tag assignment: `POST/PATCH /api/notes/:id` accepts `tags: string[]`; tags are created implicitly if missing for that user; join rows replaced wholesale (simplest correct semantics — assignment: "create and assign tags to notes").
- Validation: Zod on every request body/query in the route; 400 with a structured error `{ message }` — never a raw stack.
- Auth on API: session from cookie via better-auth `auth.api.getSession`; 401 when absent.

## 4. UI (approved prototype — `.scratch/notes-app/prototypes/ui-layout.md`)

- Single `/dashboard` page, three columns: filters sidebar | note list | editor pane.
- URL-driven state: `?tags=a,b&q=...&sort=createdAt&dir=desc` — shareable, SSR-friendly, back button works.
- Editor: title input + plain textarea body; read-only view uses `whitespace-pre-wrap`. Save via button or Ctrl/Cmd+S; PATCH on save.
- Tag chips inside editor: type + Enter adds (implicit create), ✕ removes; autocomplete from `GET /api/tags`.
- Delete: trash button → shadcn `AlertDialog` confirm → DELETE → refresh.
- Empty states: "No notes yet" CTA; "No notes match your filters" + clear-filters.
- Responsive: below `md`, columns stack; editor goes full-width with back link.

## 5. Validation & error handling

- Zod schemas shared per route (`apps/web/src/lib/validation.ts` or inline per route — decision left to build; prefer one file).
- API errors: 400 validation, 401 unauthenticated, 404 not-owned, 405 method — structured `{ message }`.
- Frontend: form errors via sonner toasts + inline field errors; no raw error dumps.

## 6. Testing (ticket test-strategy)

- **Vitest**, root `npm run test` via turbo (script must exist at root for the assignment).
- Integration: in-process route-handler invocation against real Postgres — separate `notes_app_test` DB (same docker-compose service), migrations run before suite, tables truncated between tests.
- Mandatory suites (TDD — written first):
  1. Auth flows: signup, signin, signout (200/redirects, password hashed — bcryptjs prefix visible, duplicate email).
  2. Ownership enforcement: user B cannot GET/PATCH/DELETE user A's note → 404.
  3. Filter/sort/search: multi-tag AND, ILIKE title, createdAt asc/desc, combined query.
  4. Unit: Zod validation schemas.
- A11y: axe-core assertions in Vitest per page (login, signup, dashboard list + editor states) — no violations (ticket a11y-pass).

## 7. Deployment (ticket render-deploy)

- `render.yaml` Blueprint at repo root:
  - Database: managed Postgres (`plan: basic-256mb` — free tier, expires 30 days; README notes this).
  - Web service: `runtime: docker`, `dockerfilePath: ./apps/web/Dockerfile`, `dockerContext: .`; `preDeployCommand` runs drizzle migrations (migrator + SQL copied into runner image); `healthCheckPath: /`.
  - Env: `DATABASE_URL` via `fromDatabase` (internal URL), `BETTER_AUTH_URL` = `https://<service>.onrender.com`, `BETTER_AUTH_SECRET` (secret env).
- Existing Dockerfile reused as-is (standalone output, `HOSTNAME=0.0.0.0`).

## 8. Lint & code quality (ticket lint-strategy)

- Keep oxlint/oxfmt; add root `lint` script (`turbo run lint` backing) so `npm run lint` passes.
- TypeScript strict, no `any` (scaffold `tsconfig.base.json`).
- **README must document the ESLint/Prettier substitution as a tradeoff** (assignment asks for ESLint+Prettier; evaluator may run `npm run lint` — it passes via the alias).

## 9. Accessibility checklist

- Semantic landmarks: `<header>`, `<main>`, `<nav aria-label>`, `<section aria-label>`; list = `<ul>` of buttons.
- All inputs labelled; visible focus; tag chips `aria-pressed`; AlertDialog focus-trapped; Escape closes; Cmd/Ctrl+S.
- axe all-green (automated in tests) + manual Lighthouse pass pre-deploy (no serious/critical).

## 10. Deliverables plan (build phase)

1. **GitHub repo**: repo currently has no remote — create a public repo at the end and push (deliverable #1).
2. **Live URL**: deploy via render.yaml Blueprint; verify auth/notes/tags/filtering in production.
3. **Test account**: seed via script on deploy (`POST /api/auth/sign-up` or a seed script) — one known email+password, documented in README and shared with evaluator.
4. **README.md**: how to run locally (`bun install`, `npm run db:start`, `npm run dev:web`, `npm run test`), schema + why designed this way, tradeoffs/shortcuts (lint substitution, plaintext body, implicit tag create, 404-hiding), testing approach + where TDD was used, what to improve given more time, how AI tools were used (honest account).

## Build-phase ticket suggestions (optional, via to-tickets)

- `b01` db schema + first migration (notes, tags, note_tags)
- `b02` auth wiring (bcryptjs, middleware, pages)
- `b03` notes CRUD routes + ownership
- `b04` tags routes + implicit create
- `b05` filter/sort/search query
- `b06` dashboard UI per prototype
- `b07` vitest setup + mandatory suites (TDD — start here for each path)
- `b08` axe assertions + a11y polish
- `b09` lint alias + README + repo push + Render deploy + test account
