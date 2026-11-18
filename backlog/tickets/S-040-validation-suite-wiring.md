---
id: S-040
title: "Validation suite wiring"
milestone: S2
type: validation
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-021, S-022]
estimate: 2
outputs:
  - validation/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-040. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

V1, V2 on every run in test mode, V6 golden hashes, V7 property tests; Ciw license check (G5).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
