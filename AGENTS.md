# AGENTS.md

## Git workflow

All changes are edited in place on the master branch — no worktrees, no feature branches.

Always commit with `--no-gpg-sign` — do not attempt GPG-signed commits in this repo.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/` (local-markdown tracker). See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles with default label strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root, read lazily, presence never assumed. See `docs/agents/domain.md`.