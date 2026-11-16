---
id: S-014
title: "Record simulator-as-library architecture decisions (ADR 0003) and revise PLAN"
milestone: S0
type: decision
owner: agent
review: human
status: review
priority: high
depends_on: []
estimate: 1
outputs:
  - docs/decisions/0003-simulator-as-reusable-library.md
  - docs/PLAN.md
  - sessions/2026-11-16-S-014.md
---

## Context

On 2026-11-16 the owner held an architecture brainstorming session (chat, Indonesian) with a new direction not yet in `docs/PLAN.md`: build the simulator as a reusable library for many labs and for the owner's own out-of-curriculum sandboxes, proven on caching first, while the delivery priority stays the caching and Unit 0 labs for early access. Fourteen decisions came out of it, including answers to OD-1, OD-2, OD-3, OD-5, OD-6, OD-9 and OD-10. This ticket records them and updates the plan.

## Tasks

1. Write ADR 0003 with the 14 decisions, their reasons and consequences.
2. Revise `docs/PLAN.md`: open decisions (2.1), architecture (3), reconciliation (4), slice strategy and milestones (6, 7), backlog (8), conventions (9) where affected, risks (11), owner list (13).
3. List the follow-ups that belong in `sdlab` (they are proposed, not done here).
4. Session log, board, PR.

## Done criteria

- [x] ADR 0003 records decisions 1-14 as the owner approved them in chat, with reasons
- [x] PLAN.md reflects every decision; decided ODs are marked decided; new tickets (G3, G4, sandbox) and the S-010 split are in the backlog tables with estimates in sessions
- [x] Calendar dates in PLAN 7.3 replaced by session counts (decision 13)
- [x] sdlab follow-ups listed in PLAN 10.4
- [x] `python scripts/validate.py` passes
- [ ] Owner reviewed and merged the PR (`review: human`)

## Notes

- Decisions were taken one question at a time in chat; the owner approved each. Decision 9 (owner writes the Unit 0 spec in sdlab first) overrode the agent's recommendation (a draft fixture in sdsim in parallel).
- Ticket ids S-015 to S-019 are used for the new tickets because S-020 onward are taken by the plan.
- The GitHub remote did not exist at the time of writing; creating it is the owner's S-009 (or an explicit go-ahead to the agent).
