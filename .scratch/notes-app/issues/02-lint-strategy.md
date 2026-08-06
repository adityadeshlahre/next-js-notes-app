# 02 — Lint & format strategy

Type: grilling
Status: resolved
Blocked by:

## Question

The scaffold ships oxlint + oxfmt behind `npm run check`. ASSIGNMENT.md requires "ESLint + Prettier configured, no warnings or errors on `npm run lint`". Do we comply literally or adapt?

Options:

- **Add ESLint + Prettier** (recommended): the assignment is explicit and an evaluator may run `npm run lint`; matching it exactly removes risk. ESLint flat config + Prettier, kept alongside or replacing oxlint.
- **Keep oxlint/oxfmt, add `lint` alias**: zero churn, but doesn't satisfy the literal requirement.

## Answer

**Keep oxlint/oxfmt, add `lint` alias** — root script `lint: turbo run lint` backed by oxlint; no ESLint/Prettier churn. Tradeoff accepted: the literal ESLint+Prettier requirement is unmet; README documents the substitution. Note: README "tradeoffs/shortcuts" section must call this out explicitly since an evaluator may run `npm run lint` (which will pass, via the alias).
