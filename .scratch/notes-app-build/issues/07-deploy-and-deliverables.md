# 07 — Deploy & deliverables

**What to build:** Ship the app on Render, hand the evaluator everything the assignment asks for: a `render.yaml` Blueprint that deploys the Dockerized Next.js app with managed Postgres (migrations run pre-deploy), env vars wired, a seeded test account, a public GitHub repo, and a README documenting run-locally, the schema, tradeoffs, test approach, future improvements, and AI-tool usage.

**Acceptance criteria**

- [ ] `render.yaml` Blueprint: web service (Docker) + Postgres
- [ ] Live URL fully functional: auth, notes, tags, filtering in production
- [ ] Migrations run on deploy (pre-deploy step)
- [ ] Test account seeded (email/password), documented for the evaluator
- [ ] GitHub public repo created and pushed (repo currently has no remote)
- [ ] README: run locally, DB schema + why, tradeoffs/shortcuts (incl. lint substitution, plaintext body), testing approach + TDD, future improvements, AI usage

**Blocked by:** `#05` (feature-complete before deploy), plus Lighthouse gate in #06

Sources: `.scratch/notes-app/spec.md` §7 (deploy), §10 (deliverables); wayfinder tickets `render-deploy`.