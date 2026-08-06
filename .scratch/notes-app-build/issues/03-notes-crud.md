# 03 — Notes CRUD end-to-end

**What to build:** A signed-in user can create, edit, and delete their own notes (title + body) through the dashboard UI, and the API enforces ownership: a user can only see and mutate their own notes, cross-user access returning 404. Plain textarea body rendered with `whitespace-pre-wrap`.

**Blocked by:** 01 (build harness), 02 (auth)

**Status:** ready-for-agent

- [ ] Create a note (title + body) — appears in the list
- [ ] Edit a note (PATCH partial update) — change persists
- [ ] Delete a note (with confirmation) — disappears
- [ ] Every API call scoped to session user; cross-user read/edit/delete → 404
- [ ] Invalid input → 400 (Zod), structured error, no raw stack
- [ ] Integration tests: CRUD happy paths, ownership enforcement (user B cannot touch user A's notes), Zod validation
- [ ] List of notes loads from the API and shows title + body snippet

Source: `.scratch/notes-app/spec.md` §1, §3, §4, §5; wayfinder tickets `api-layer`, `note-model`, `note-editor-format`, `ui-layout` (first two columns).