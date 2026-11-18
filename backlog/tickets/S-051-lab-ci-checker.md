---
id: S-051
title: "Lab CI checker"
milestone: S2
type: validation
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-050]
estimate: 1
outputs:
  - packages/cli
  - validation/labs
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-051. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Baseline, reference, wrong answers, margins, flake check, time budget, C12-C13.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
