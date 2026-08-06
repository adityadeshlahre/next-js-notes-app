# 05 — Filter, sort, search

**What to build:** A signed-in user can filter notes by one or more tags (AND — note must match all selected), search notes by title (case-insensitive substring), and sort by created date newest/oldest. All state lives in URL search params (shareable, SSR-friendly) and combines into one server query. Empty states: "No notes yet" and "No notes match your filters".

**Blocked by:** 01 (build harness), 03 (notes CRUD), 04 (tags)

**Acceptance criteria**

- [ ] Filter by multiple tags = note matches ALL selected (AND)
- [ ] Search by title (case-insensitive substring, ILIKE) — title only, not body
- [ ] Sort by created date asc/desc
- [ ] All three combine in one server query
- [ ] Filter/search/sort state round-trips through URL search params (`?tags=a,b&q=...&sort=...&dir=...`)
- [ ] Filter UI in the sidebar + search box + sort control per the approved prototype
- [ ] empty states handled gracefully (no raw errors)

Source: `.scratch/notes-app/spec.md` §3 (GET /api/notes), §4 (UI), wayfinder ticket `filter-sort-search`.