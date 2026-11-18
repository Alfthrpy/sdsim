---
id: S-001
title: "Toolchain and CI skeleton"
milestone: S0
type: infra
owner: agent
review: human
status: todo
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

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
