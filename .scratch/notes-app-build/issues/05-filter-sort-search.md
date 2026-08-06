# 05 — Filter, sort, search

**What to build:** A signed-in user can filter notes by one or more tags (AND — note must match all selected), search notes by title (case-insensitive substring), and sort by created date newest/oldest. All state lives in URL search params (shareable, SSR-friendly) and combines into one server query. Empty states: "No notes yet" and "No notes match your filters".

**Blocked by:** 01 (build harness), 03 (notes CRUD), 04 (tags)

**Acceptance criteria**

- [x] Filter by multiple tags = note matches ALL selected (AND)
- [x] Search by title (case-insensitive substring, ILIKE) — title only, not body
- [x] Sort by created date asc/desc
- [x] All three combine in one server query
- [x] Filter/search/sort state round-trips through URL search params (`?tags=a,b&q=...&sort=...&dir=...`)
- [x] Filter UI in the sidebar + search box + sort control per the approved prototype
- [x] empty states handled gracefully (no raw errors)

## Comments

- Commit: `a02a20a`. GET /api/notes now parses `q`/`tags`/`sort`/`dir` via `listNotesQuerySchema` (Zod, 400 on invalid): `q` ILIKE on title with LIKE-wildcard escaping (`escapeLike`), `tags` comma list deduped/normalized → subquery on note_tags⋈tags grouped with `count = n` HAVING (AND semantics), `dir` asc|desc on createdAt (default desc). Filters combine in one query. Tests: 5 new in `tests/notes.test.ts` — title-only ILIKE case-insensitive, body not searched, multi-tag AND, sort asc/desc (explicit createdAt to avoid ms ties), combined q+tags+dir, invalid dir → 400. 31 total tests green.
- UI: 3-column layout (filters | list | editor) per prototype; filters nav: search input (300ms debounce), sort select, tag toggle buttons with `aria-pressed`; URL-driven state via `useSearchParams`/`useRouter` (`?tags=…&q=…&dir=…`), back button works, `page.tsx` wraps client dashboard in `<Suspense>`. Empty states: "No notes yet" CTA vs "No notes match your filters" + clear filters. Columns stack below md.
- Deferred (out of scope): relative timestamps ("2m ago"), mobile editor back-link navigation (prototype "v1: responsive stack, no special mobile nav").

Source: `.scratch/notes-app/spec.md` §3 (GET /api/notes), §4 (UI), wayfinder ticket `filter-sort-search`.
