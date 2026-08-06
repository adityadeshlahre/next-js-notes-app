# 12 — Accessibility bar

Type: grilling
Status: open
Blocked by:

## Question

What does "no accessibility errors in axe or Lighthouse" mean as a deliverable, and how do we get there?

Decisions needed:

- Tooling: axe-core + @axe-core/playwright or just Lighthouse in manual QA? (recommended: axe in automated tests or CI check + Lighthouse manual pass before deploy)
- Does the a11y pass land as part of the build spec (tasks inside each feature: semantic HTML, labels, keyboard flow) or as a standalone review task before deploy? (recommended: baked into features, reviewed at the end)
- Target: axe all-green (no serious/critical), keyboard-only walkthrough of every flow, semantic landmarks.
