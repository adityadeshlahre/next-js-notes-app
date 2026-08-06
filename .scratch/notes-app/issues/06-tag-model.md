# 06 — Tag model

Type: grilling
Status: open
Blocked by: 05

## Question

How do tags work in the schema?

Spec decisions needed:

- Ownership: tags are private per user (`userId` FK), matching notes — or global? Private (recommended).
- Join table `note_tags` (noteId, tagId, unique pair) — agreed.
- Name rules: trimmed, lowercase-normalized? unique per user?
- Tag CRUD: is tag creation implicit (inline when assigning) or explicit (`POST /api/tags`)?
