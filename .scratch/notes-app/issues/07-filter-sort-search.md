# 07 — Filter, sort & search semantics

Type: grilling
Status: resolved
Blocked by:

## Question

What exactly do filtering, sorting, and search mean, and where does the state live?

Spec decisions needed:

- Multi-tag filter: notes matching **all** selected tags (AND, recommended) or **any** (OR)?
- Search: case-insensitive substring match on title (ILIKE, recommended) — body too?
- Sort: `createdAt` desc/asc via `?sort=createdAt&dir=desc` (recommended) — `updatedAt` an option?
- State location: URL search params (`/dashboard?tags=a,b&q=hello&sort=desc`) so filters are shareable and SSR-friendly (recommended) vs client-only state.
- Combine all three (tags AND search AND sort) in one server query.

## Answer

**AND + ILIKE title + URL search params.** Multi-tag filter = note must match ALL selected tags (AND, via join + GROUP BY/HAVING count). Search = case-insensitive substring on title (ILIKE `%term%`), title only. Sort = `createdAt` desc/asc via `?sort=createdAt&dir=asc|desc`. State lives in URL search params (`/dashboard?tags=a,b&q=hello&sort=createdAt&dir=desc`) — shareable, SSR-friendly. All three combine into one server-side query on `GET /api/notes`.
