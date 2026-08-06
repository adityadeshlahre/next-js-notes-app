# 04 — Tags end-to-end

**What to build:** A signed-in user can assign tags to a note (multiple per note, note↔tag many-to-many). Typing a tag name in the note editor creates it if missing (implicit creation, unique per user), tags are displayed on each note, and autocomplete suggestions come from the user's existing tags.

**Blocked by:** 01 (build harness), 03 (notes)

**Status:** ready-for-agent

- [ ] Each note shows its assigned tags
- [ ] Assigning a tag auto-creates it if the user doesn't have it yet
- [ ] Removing a tag from a note detaches it
- [ ] Tags are private per user — never shared across users
- [ ] Tag name trimmed + lowercased, unique per user
- [ ] Autocomplete shows existing user tags when typing in the editor

Source: `.scratch/notes-app/spec.md` §1 (tags + note_tags schema), §3 (implicit create), §4 (tag chips); wayfinder ticket `tag-model`.