# 05 — Filter, sort, search

**What to build:** A signed-in user can filter notes by one or more tags (AND — note must match all selected), search notes by title (case-insensitive substring), and sort by created date newest/oldest. All state lives in URL search params (shareable, SSR-friendly) and combines into one server query. Empty states: "No notes yet" and "No notes match your filters".

**Blocked by:** 01 (build harness), 03 (notes CRUD), 04 (tags)

**Acceptance criteria**

- [x] Filter by multiple tags = note matches ALL selected (AND)
- [x] Search by title (case-insensitive substring, ILIKE) — title only, not body
- [x] Sort by created date asc/desc
- [x] All three combine in one server query
- [~] Filter/search/sort state round-trips through URL search params (`?tags=a,b&q=...&sort=...&dir=...`) — **superseded**: deliberately changed to React local state + TanStack Query (see Comments); no shareable/back-button URL state
- [x] Filter UI in the sidebar + search box + sort control per the approved prototype
- [x] empty states handled gracefully (no raw errors)

## Comments

- Commit: `a02a20a`; review fixes `ddaa154`. GET /api/notes now parses `q`/`tags`/`sort`/`dir` via `listNotesQuerySchema` (Zod, 400 on invalid): `q` ILIKE on title with LIKE-wildcard escaping (`escapeLike`), `tags` comma list deduped/normalized → subquery on note_tags⋈tags grouped with `count = n` HAVING (AND semantics), `dir` asc|desc on createdAt (default desc). Filters combine in one query. Tests: 5 new in `tests/notes.test.ts` — title-only ILIKE case-insensitive, body not searched, multi-tag AND, sort asc/desc (explicit createdAt to avoid ms ties), combined q+tags+dir, invalid dir → 400. 31 total tests green.
- UI: 3-column layout (filters | list | editor) per prototype; filters nav: search input (300ms debounce), sort select, tag toggle buttons with `aria-pressed`; URL-driven state via `useSearchParams`/`useRouter` (`?tags=…&q=…&dir=…`), back button works, `page.tsx` wraps client dashboard in `<Suspense>`. Empty states: "No notes yet" CTA vs "No notes match your filters" + clear filters. Columns stack below md.
- **2026-08-07 superseded by design decision:** filters moved out of the URL into `NotesDashboard` local state (`qDraft`/`q`/`tagsParam`/`dir`) so page-level RSC re-renders stopped; children `FilterSidebar`/`NotesList`/`NoteEditor` are memoized pure components; data fetching moved to **@tanstack/react-query 5.101.4** — `useQuery(["notes", url])` with `keepPreviousData`, tags via `useQuery(["tags"])`, save/delete `invalidateQueries`. The URL-state AC above is closed as superseded, not done. README Tradeoffs updated accordingly ("no shareable/back-button URL state — known tradeoff").
- Deferred (out of scope): relative timestamps ("2m ago"), mobile editor back-link navigation (prototype "v1: responsive stack, no special mobile nav").
- Review fixes (2-axis review vs `7ae37d8`): seq-guarded refetch (out-of-order filter races), Delete fallback so a selected note that dropped out of the filtered list can still be deleted, client-side `dir` validation so hand-edited bad URLs fall back to desc instead of a dead list, save now refetches when a filter is active (no phantom notes), `router.push` for tag/sort toggles so back button undoes filter steps (debounced search stays `replace`), LIKE-wildcard (`%`/`_`) literal tests + whitespace-only q test (33 total green), comma rejected in tag names (round-trip safety), `q` trimmed. Kept: `sort=createdAt` param validated for contract completeness, unused `sort` wiring. Known minor: debounce timer is not cancelled on back-nav (guarded, harmless), caps on `tags` param are coarse (500 chars, no per-tag cap — matches nothing harmlessly), no loading indicator during refetch (stale list until fetch lands).

Source: `.scratch/notes-app/spec.md` §3 (GET /api/notes), §4 (UI), wayfinder ticket `filter-sort-search`.
