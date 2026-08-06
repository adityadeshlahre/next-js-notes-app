# 01 — API layer shape

Type: grilling
Status: resolved
Blocked by:

## Question

Should notes and tags CRUD be implemented as REST route handlers under `apps/web/src/app/api/*` or as Next.js Server Actions called directly from client components?

Assignment language says "server-side ownership checks on every API call", and the auth scaffold already lives at `app/api/auth/[...all]/route.ts`. Options:

- **REST route handlers** (recommended): clean separation, trivially testable with in-process requests, mirrors the existing auth routes, ownership checks in one place per resource.
- **Server Actions**: less boilerplate for form flows, but tighter coupling to the client, and "API call" framing fits REST better.

## Answer

**REST route handlers** under `apps/web/src/app/api/*` — `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/:id`, `GET/POST /api/tags`, scoped by session `userId`. Testable in-process, mirrors the existing `app/api/auth` routes, matches the assignment's "every API call" framing.
