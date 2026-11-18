---
id: S-060
title: "Web shell and Pages deploy"
milestone: S2
type: ui
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-007, S-013, S-009]
estimate: 2
outputs:
  - apps/web
  - .github/workflows/pages.yml
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-060. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Vite app, Worker bridge (from spike A), hash routes, mobile layout, Pages deploy, Playwright smoke at 360 x 800.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
