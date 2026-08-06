# 04 — Tags end-to-end

**What to build:** A signed-in user can assign tags to a note (multiple per note, note↔tag many-to-many). Typing a tag name in the note editor creates it if missing (implicit creation, unique per user), tags are displayed on each note, and autocomplete suggestions come from the user's existing tags.

**Blocked by:** 01 (build harness), 03 (notes)

**Status:** ready-for-agent

- [x] Each note shows its assigned tags
- [x] Assigning a tag auto-creates it if the user doesn't have it yet
- [x] Removing a tag from a note detaches it
- [x] Tags are private per user — never shared across users
- [x] Tag name trimmed + lowercased, unique per user
- [x] Autocomplete shows existing user tags when typing in the editor

## Comments

- Commit: `f09d079`; review fixes `7ae37d8`. Schema: `tags` + `note_tags` in `packages/db/src/schema/tags.ts`, migration `0002_acoustic_spiral.sql`. Shared helpers in `apps/web/src/lib/tags.ts` (`upsertTags` onConflictDoNothing + re-select, `replaceNoteTags` wholesale inside `db.transaction`, `noteTagsByName` ordered). Routes: `GET /api/tags`, notes POST/GET/PATCH now include `tags: string[]` (normalized names from join). PATCH accepts tags-only updates (ownership 404 still enforced, tested). `tests/tags.test.ts` 7 tests: auto-create + normalize + dedupe (DB assert 1 row), list tags, PATCH replace/detach, PATCH [] clears, per-user privacy, autocomplete list sorted, cross-user tags-only PATCH 404. 26 total tests green. UI: tag chips on list items + editor chips w/ ✕ remove, native `<datalist>` autocomplete filtered by prefix, tags sent on save; tag input lowercased client-side.
- Trimmed+lowercased enforced on write by `normalizeTagName` in `upsertTags`; zod validates length/emptiness.
- Deferred (outside ticket scope): GET /api/notes filters (q/sort/tags AND) → ticket 05, 3-column layout w/ filters sidebar → 05, styled autocomplete dropdown + keyboard operability → 06 (a11y), Zod schema unit tests → 06, upsertTags-before-insert orphan edge (harmless, per-user unique) — no tx. Relations removed (unused — explicit joins used).

Source: `.scratch/notes-app/spec.md` §1 (tags + note_tags schema), §3 (implicit create), §4 (tag chips); wayfinder ticket `tag-model`.
