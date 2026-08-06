# 07 — Filter, sort & search semantics

Type: grilling
Status: open
Blocked by:

## Question

What exactly do filtering, sorting, and search mean, and where does the state live?

Spec decisions needed:

- Multi-tag filter: notes matching **all** selected tags (AND, recommended) or **any** (OR)?
- Search: case-insensitive substring match on title (ILIKE, recommended) — body too?
- Sort: `createdAt` desc/asc via `?sort=createdAt&dir=desc` (recommended) — `updatedAt` an option?
- State location: URL search params (`/dashboard?tags=a,b&q=hello&sort=desc`) so filters are shareable and SSR-friendly (recommended) vs client-only state.
- Combine all three (tags AND search AND sort) in one server query.
