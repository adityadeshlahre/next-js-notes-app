# 06 — Accessibility pass

**What to build:** The app ticks "no accessibility errors in axe or Lighthouse" — automated axe checks in the test suite on every page, a clean keyboard-only walkthrough of every flow, semantic HTML landmarks throughout, and a full Lighthouse audit green before launch.

**Blocked by:** #05 (filter/sort/search — all pages built)

**Status:** done (automated part) — 2026-08-07

## Comments

- **2026-08-07 done:** automated axe assertions landed — `apps/web/tests/a11y.test.tsx` (happy-dom + RTL + axe-core, new devDeps) covers `/login` (sign-in + sign-up states), `/dashboard` empty state, and dashboard with notes + open editor: zero axe violations. Tag combobox test verifies listbox/option semantics + arrow/enter keyboard flow. Landmarks added: `<main>` in root layout, `<header>` + `nav aria-label="Primary"`; note editor gained a mobile-only "← Back to notes" link (ticket #3 of leftover list). Tag `<datalist>` replaced by keyboard-operable `TagCombobox` (role=combobox/listbox, aria-expanded/activedescendant, ArrowDown/Up/Enter/Escape) — no new runtime deps. 37 tests green, check-types/lint/build green.
- Manual keyboard walkthrough + Lighthouse (no serious/critical) still pending — needs a real browser; run before final sign-off.

- [x] axe-core assertions in Vitest for: `/login`, `/signup`, `/dashboard` (list + editor states) — zero violations
- [x] Semantic HTML landmarks: `<header>`, `<main>`, `<nav aria-label=...>`, `<section aria-label=...>`
- [x] Every input labelled; visible focus; tag chips `aria-pressed`
- [x] Editor editable by keyboard, all flows reachable by keyboard (combobox listbox nav automated; full manual walkthrough pending)
- [ ] Manual keyboard walkthrough + Lighthouse (no serious/critical) — pending, real-browser step

Source: wayfinder ticket `a11y-pass`, spec §4/§9.
