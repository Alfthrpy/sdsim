---
id: S-015
title: "Process runtime and registry"
milestone: S2
type: engine
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-007, S-010]
estimate: 1
outputs:
  - packages/engine/src/process
  - packages/engine/src/registry
  - docs/api.md
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-015. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Generator processes, reply/call/handoff, hold/release on Station and Pool, component registry and descriptor loading; docs/api.md lists every export (ADR 0003 #1, #2, #4, #6).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
