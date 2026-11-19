---
id: S-011
title: "Lab matrix with real concept ids"
milestone: S1
type: lab
owner: agent
review: human
status: review
priority: high
depends_on: [S-010]
estimate: 1
outputs:
  - docs/lab-matrix.md
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.2, ticket S-011. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Per lab concept: modelability, needed components, owning vs secondary concept, recommendation; proposal text for sdlab. Output is the OD-4 decision.

## Done criteria

- [x] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met (open: PR and CI not done yet; the owner's review of the lab list is pending)
- [x] `python scripts/validate.py` passes

## Notes

- Output: `docs/lab-matrix.md`. The 25 concepts that list `lab` in `sdlab` (commit `55a509d`; `docs/HANDOFF.md` says 24, the file says 25) each have a planned label, components, owning or secondary role, a recommendation and an objective-by-objective reading. Recommendation: 15 labs (15 owners, 4 merges, 5 drops, 1 deferred). The master plan's target was 16.
- Sources: `sdlab` `curriculum/concepts.yaml`, read from a read-only clone; the master plan (Claude Docs) tables 4.3, 4.4, 4.5, R3, R5; `docs/PLAN.md`; ADR 0003.
- `sdlab`'s `scripts/validate.py` counts a concept named in `secondary_concepts` as having its lab. Merging needs no `formats` edit; dropping or deferring does.
- Section 6 lists catalog gaps G1 to G15. They are open questions for planned tickets (S-022, S-023a/b, S-025a/c, S-026, S-027, S-028, S-029, S-031, S-083), not new tickets, until the owner decides OD-4.
- Review: `model-reviewer`, pass with minor fixes. The reviewer could not read the master plan, so metric ids, MP lab ids and MP labels were checked by the author only. Fixed after review: evidence per planned label (section 2.1), `cascading-failure` made conditional on V4(a), `rate-limiting` counted 0/4 and merged into `load-shedding`, `single-machine-limits` and `caching-basics` counts, explicit concept lists in the `sdlab` proposal, ticket columns, C12 as the guard for timeout labs, `delivery-semantics` idempotent flag labelled illustrative, gaps G13 to G15, and an explicit selection rule.
- Owner to do: decide the six questions in section 8 (OD-4). Then an `sdlab` session turns section 7 into a ticket.
- After approval: update `docs/PLAN.md` OD-4 and R4 and `docs/HANDOFF.md` (24 vs 25).
