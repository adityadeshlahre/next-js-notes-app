# 06 — Tag model

Type: grilling
Status: resolved
Blocked by: 05

## Question

How do tags work in the schema?

Spec decisions needed:

- Ownership: tags are private per user (`userId` FK), matching notes — or global? Private (recommended).
- Join table `note_tags` (noteId, tagId, unique pair) — agreed.
- Name rules: trimmed, lowercase-normalized? unique per user?
- Tag CRUD: is tag creation implicit (inline when assigning) or explicit (`POST /api/tags`)?

## Answer

**Private per-user tags, implicit creation.** `tags` table: `id` uuid, `userId` FK, `name` (trimmed, lowercased, unique per user, indexed). `note_tags` join table (noteId FK, tagId FK, unique pair). Assigning a tag to a note auto-creates it if it doesn't exist for that user; no standalone `POST /api/tags` needed (though `GET /api/tags` may exist for the filter UI). Deletion/rename happens implicitly when the last note's tag reference is removed — kept intentionally minimal (assignment only asks to "create and assign tags").
