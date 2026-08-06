# 09 — UI layout prototype

Type: prototype
Status: resolved
Blocked by: 08

## Question

What does the dashboard/editor layout look like, and how is it keyboard-navigable?

Prototype a rough take (stub HTML/CSS or a shadcn component sketch) for the human to react to:

- Layout: single dashboard page with note list + editor side-by-side, or list → editor navigation? Sidebar with tags/filters?
- Where filters/search/sort controls live.
- Keyboard flow: focus order, list navigation, delete confirmation, dialog vs inline.
- Semantic structure: `<main>`, `<nav>`, `<section>`, labels, ARIA for tag chips.

Link the prototype as an asset here; resolve when the human has reacted.

## Answer

**Approved as sketched** — asset: [`prototypes/ui-layout.md`](../prototypes/ui-layout.md). Three-column dashboard (filters sidebar | note list | editor pane), URL-driven filter state, tag chips with implicit creation + autocomplete, Ctrl/Cmd+S save, AlertDialog delete, `aria-pressed` toggle chips, responsive stack below `md`.
