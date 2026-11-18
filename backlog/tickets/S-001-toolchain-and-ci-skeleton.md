---
id: S-001
title: "Toolchain and CI skeleton"
milestone: S0
type: infra
owner: agent
review: human
status: review
priority: high
depends_on: []
estimate: 1
outputs:
  - package.json
  - tsconfig.base.json
  - eslint.config.js
  - packages/*/package.json
  - .github/workflows/ci.yml
  - docs/decisions/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.1, ticket S-001. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

npm workspaces (incl. packages/components, sandbox/), TS 6.0.3, Vitest, ESLint bans and boundaries (sandbox imports public entry points only), Prettier, ci.yml; fix engineering.md wording (R13) and its layer table (ADR 0003); add a ux-reviewer subagent stub; ADR for the toolchain; confirm GitHub Actions is free on the public repo.

## Done criteria

- [x] npm workspaces with `packages/{engine,components,lab-runtime,cli}` and `sandbox/`; TS 6.0.3 strict; Vitest; ESLint with engine bans and layer boundaries; Prettier; `ci.yml`
- [x] The engine bans and the boundaries are proven to fire (a temporary file breaking each rule failed lint; removed afterwards)
- [x] `engineering.md` wording (R13) and layer table (ADR 0003) fixed; `ux-reviewer` stub added; ADR 0004 written
- [x] `npm run lint`, `format`, `typecheck`, `npm test` and `python scripts/validate.py` pass locally
- [ ] CI is green on GitHub, which also confirms free Actions minutes on the public repo (verified when the PR runs)
- [ ] Owner reviewed and merged (`review: human`)

## Notes

- `docs/PLAN.md` says `tickets.yml` exists; it does not. `ci.yml` has a `tickets` job (validate.py and the unit tests) instead.
- `npm audit`: one moderate advisory (minimatch, via typescript-eslint 8.72.2, dev-only). Not fixed because the pin is from PLAN 5.3; see ADR 0004.
- Added `@types/node` 24.10.1 (not in PLAN 5.3) for `packages/cli` and Vitest; the engine packages use `types: []`, so it does not reach them.
- Prettier excludes Markdown, `backlog/` and `sessions/` so existing docs are not reformatted.
- The ADR is `0004` and is marked `proposed` until the owner merges.
