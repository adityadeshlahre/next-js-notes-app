# 03 — Notes CRUD end-to-end

**What to build:** A signed-in user can create, edit, and delete their own notes (title + body) through the dashboard UI, and the API enforces ownership: a user can only see and mutate their own notes, cross-user access returning 404. Plain textarea body rendered with `whitespace-pre-wrap`.

**Blocked by:** 01 (build harness), 02 (auth)

**Status:** ready-for-agent

- [x] Create a note (title + body) — appears in the list
- [x] Edit a note (PATCH partial update) — change persists
- [x] Delete a note (with confirmation) — disappears
- [x] Every API call scoped to session user; cross-user read/edit/delete → 404
- [x] Invalid input → 400 (Zod), structured error, no raw stack
- [x] Integration tests: CRUD happy paths, ownership enforcement (user B cannot touch user A's notes), Zod validation
- [x] List of notes loads from the API and shows title + body snippet

## Comments

- 2026-08-06: Implemented. Notes schema + migration `0001_overjoyed_spiral.sql`; API routes `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/[id]` (ownership-scoped, 401/404/400 structured `{ message }`); shared Zod schemas in `apps/web/src/lib/validation.ts`; dashboard two-pane UI (list + editor, Ctrl/⌘+S save, AlertDialog delete confirm). 7 integration tests (incl. cross-user 404, no existence leak) — 18 total green. Notes: test files now run sequentially (`fileParallelism: false`) since both suites truncate shared tables.

Source: `.scratch/notes-app/spec.md` §1, §3, §4, §5; wayfinder tickets `api-layer`, `note-model`, `note-editor-format`, `ui-layout` (first two columns).
