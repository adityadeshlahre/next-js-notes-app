# 06 — Accessibility pass

**What to build:** The app ticks "no accessibility errors in axe or Lighthouse" — automated axe checks in the test suite on every page, a clean keyboard-only walkthrough of every flow, semantic HTML landmarks throughout, and a full Lighthouse audit green before launch.

**Blocked by:** #05 (filter/sort/search — all pages built)

**Status:** ready-for-agent

- [ ] axe-core assertions in Vitest for: `/login`, `/signup`, `/dashboard` (list + editor states) — zero violations
- [ ] Semantic HTML landmarks: `<header>`, `<main>`, `<nav aria-label=...>`, `<section aria-label=...>`
- [ ] Every input labelled; visible focus; tag chips `aria-pressed`
- [ ] Editor editable by keyboard, all flows reachable by keyboard
- [ ] Manual keyboard walkthrough + Lighthouse (no serious/critical)

Source: wayfinder ticket `a11y-pass`, spec §4/§9.