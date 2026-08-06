# Dashboard UI — rough wireframe (prototype)

Single dashboard page at `/dashboard`, three columns. Header sits above all columns.

```
┌────────────────────────────────────────────────────────────────┐
│ Header: ☰ NotesApp        [Theme toggle] [User menu ▾] [Sign out]│
├───────────────┬──────────────────────────┬──────────────────────┤
│ Sidebar       │ Note list                │ Editor pane          │
│ (filters)     │                          │                      │
│ ───────────── │ [search input ........]  │ Title: [...........] │
│ Search:       │ Sort: [Newest ▾]         │                      │
│ [........]    │ ───────────────────────  │ Body:                │
│               │ ◉ Tag chip a  ✕          │ ┌──────────────────┐ │
│ Tags:         │ ◉ Tag chip b  ✕          │ │                  │ │
│ [✓ all]       │                          │ │  textarea        │ │
│ [✓ tag-a]     │ • Note 3                │ │                  │ │
│ [✓ tag-b]     │   tag-a, tag-b          │ └──────────────────┘ │
│ [  tag-c]     │   2m ago                 │                      │
│               │ • Note 2                │ [Save] [Cancel] [🗑]  │
│               │   tag-a                 │                      │
│               │   1h ago                 │                      │
│               │ • Note 1                │                      │
│               │   (no tags)             │                      │
│               │   3d ago                 │                      │
│               │                          │                      │
│               │ [+ New note]            │                      │
└───────────────┴──────────────────────────┴──────────────────────┘
```

## Behavior

- **URL state**: `?tags=tag-a,tag-b&q=...&sort=createdAt&dir=desc` — tag chips toggle in URL, search box filters on submit (debounced optional), sort is a select.
- **Note list**: click a note → loads it in the editor pane (PATCH on save). `+ New note` creates via POST and opens empty editor.
- **Delete**: trash button in editor → confirmation dialog (shadcn `AlertDialog`) → DELETE, list refreshes.
- **Tag assignment**: tag chips row inside the editor — type a tag name + Enter → adds chip (implicit creation); ✕ removes. Autocomplete suggestions from user's existing tags (GET /api/tags).
- **Empty states**: no notes → centered "No notes yet" + CTA; no search matches → "No notes match your filters" + clear-filters link.

## Keyboard & a11y

- Semantic: `<header>`, `<main>`, `<nav aria-label="Filters">`, `<section aria-label="Notes">`, `<section aria-label="Editor">`.
- Note list = `<ul>` of buttons; arrow-key navigation optional (skip for v1 — tab order suffices).
- Search/sort/tags: all labelled (`<label>` / `aria-label`), visible focus rings.
- Tag chips = toggle buttons with `aria-pressed`.
- Delete dialog: focus trapped in AlertDialog (shadcn handles), Escape closes.
- Save: `Ctrl/Cmd+S` inside editor saves (preventDefault), form submit works too.

## Mobile

Below `md`: columns stack — header, search+tags, list; tapping a note opens the editor full-width with a back link. (v1: responsive stack, no special mobile nav.)
