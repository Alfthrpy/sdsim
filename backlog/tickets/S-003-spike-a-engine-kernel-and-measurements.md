---
id: S-003
title: "Spike A: engine kernel and measurements"
milestone: S0
type: spike
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-001]
estimate: 2
outputs:
  - packages/engine/src/kernel
  - docs/spikes/A.md
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.1, ticket S-003. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Kernel in packages/engine (heap, clock, RNG streams, M/M/c station, Worker bridge) to production conventions; measure A1-A6 including the generator-process path (ADR 0003 #2); M/M/1 and M/M/4 oracles; golden hash on Node.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
