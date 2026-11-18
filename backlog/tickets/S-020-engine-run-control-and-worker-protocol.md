---
id: S-020
title: "Engine run control and Worker protocol"
milestone: S2
type: engine
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-007]
estimate: 1
outputs:
  - packages/engine/src/kernel
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-020. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

init/edit/run/snapshot/result protocol, event budget (kernel built in S-003).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
