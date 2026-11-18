---
id: S-103
title: "Lab flow design: case, play, tune, check"
milestone: S1
type: decision
owner: agent
review: human
status: review
priority: high
depends_on: []
estimate: 1
outputs:
  - docs/design/lab-flow.md
  - docs/PLAN.md
---

## Context

The owner tried the spike C prototype on a phone and could not tell what the screen was about: no story, nothing moving, no moment of "this is what is broken". They want: a case, then tune and check, then a play mode that shows the architecture running and holding or failing. PLAN has play only as S-063 (post-BG2, cut list). S-010 (contract schema) has not started, so scenario and play fields can be added now at no breaking-change cost.

## Tasks

1. Write `docs/design/lab-flow.md`: the flow, play as a replay of a recorded run, node states, what crash can and cannot show, wireframes, contract and engine consequences, a worked case for `sdlab`.
2. Propose the plan changes (new S-063a, S-010 fields, S-021 and S-050 notes, session counts) and apply them to `docs/PLAN.md` and the ticket files so the owner reviews one coherent diff.
3. Create S-063a.

## Done criteria

- [x] The design document exists and answers: what the learner sees at each step, what the engine records, what "crash" can show with the current lab, what changes in the contract
- [x] PLAN and tickets reflect the proposed changes (S-063a created, S-010 depends on this ticket, counts updated)
- [x] `python scripts/validate.py` passes
- [ ] Owner approved the flow and the plan changes (`review: human`)

## Notes

- The current caching lab baseline runs the database at about 84%: "strained", not "failing". A visible crash needs a load that overloads the database (about 240 requests/s gives about 126%); that is a calibration change owned by `sdlab`, proposed in the document, not made here.
- Open for the owner: play one tap after the case (proposed) or on by default; whether the peak of 240 is acceptable.
