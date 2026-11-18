---
id: S-070
title: "Vertical slice: caching lab end to end"
milestone: S2
type: lab
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-023a, S-024, S-025a, S-040, S-051, S-061, S-062, S-068, S-063a]
estimate: 1
outputs:
  - validation/labs/caching-basics
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-070. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Caching lab from sdlab end to end; lab CI and V5 subset for L05; propose recalibration to sdlab if needed.

## Done criteria

- [ ] Carried over from S-003b: run the caching lab's model in both styles (callbacks and generator processes) in a Worker, compare grading time and events per request with the numbers in `docs/spikes/A.md`, and record whether the generator style meets the 5 s grading budget (and, on the owner's phone from S-008, the budget at that speed)

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
