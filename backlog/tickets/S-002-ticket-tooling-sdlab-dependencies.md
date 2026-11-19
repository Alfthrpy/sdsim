---
id: S-002
title: "Ticket tooling: sdlab dependencies"
milestone: S0
type: infra
owner: agent
review: agent
status: in-progress
priority: medium
depends_on: [S-001]
estimate: 1
outputs:
  - scripts/
  - tests/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.1, ticket S-002. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Accept `sdlab:<id>` in depends_on, read status from ../sdlab when present, fixture tests (R16).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
