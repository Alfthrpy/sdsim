---
id: S-050
title: "Lab runtime"
milestone: S2
type: engine
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-010b, S-021]
estimate: 2
outputs:
  - packages/lab-runtime
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-050. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Load (Ajv + catalog checks), edits, K = 5 seeds, targets, structural rules, result ids.


Added by S-103: Also return the recorded series of seed 1 next to the grading result, for the play replay (`docs/design/lab-flow.md` section 2).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
