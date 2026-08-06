# 05 — Note model & CRUD semantics

Type: grilling
Status: open
Blocked by:

## Question

What is the note model and its CRUD contract?

Spec decisions needed:

- Columns: `id`, `userId` (FK), `title`, `body`, `createdAt`, `updatedAt` — anything else?
- Ownership enforcement: every query scoped by `userId` from the session; cross-user access returns 404 (not 403) to avoid leaking existence — agreed?
- Delete: hard delete (recommended) vs soft delete.
- Update: full replace of title+body, or PATCH semantics?

Recommended shape: REST endpoints `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/:id`, all scoped by session `userId`, 404 on cross-user, hard delete, 400 on invalid input.
