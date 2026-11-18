---
id: S-003
title: "Spike A part 1: engine kernel, oracles and Node measurements"
milestone: S0
type: spike
owner: agent
review: agent
status: in-progress
priority: high
depends_on: [S-001]
estimate: 2
outputs:
  - packages/engine/src/kernel
  - docs/spikes/A.md
---

## Context

First half of PLAN S-003 (the Worker bridge and browser measurements moved to S-003b). The kernel is kept as production code (PLAN R12).

## Tasks

Kernel in `packages/engine` (heap, clock, RNG streams, M/M/c station in callback and generator style); M/M/1 and M/M/4 oracles; golden hash on Node; throughput measured for both styles (ADR 0003 #2).

## Done criteria

- [x] Heap, clock, seeded streams and M/M/c station exist in `packages/engine`
- [x] M/M/1 (rho 0.5, 0.8, 0.9) and M/M/4 oracle tests pass for both styles, tolerances stated in the test
- [x] Same seed gives the same hash; golden hash recorded
- [x] Throughput of both styles measured and written down in `docs/spikes/A.md`
- [x] `python scripts/validate.py`, lint, typecheck and tests pass
- [ ] Independent review (code-reviewer) done and findings fixed

## Notes

- Throughput is borderline for callbacks and below budget for generators; see `docs/spikes/A.md`. No decision is taken here.
- A1-A6 as defined in the master plan could not be read in this session (no document id); S-003b and the SG0 summary should check them against the master plan.
