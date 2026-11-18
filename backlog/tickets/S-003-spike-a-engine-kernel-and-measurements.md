---
id: S-003
title: "Spike A part 1: engine kernel, oracles and Node measurements"
milestone: S0
type: spike
owner: agent
review: agent
status: review
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
- [x] Independent review (code-reviewer) done and findings fixed (see Notes)

## Notes

- Throughput is borderline for callbacks (4.6 to 5.2 M events/s) and below budget for generators (3.3 to 3.7); see `docs/spikes/A.md`. No decision is taken here.
- Review (code-reviewer subagent, conclusion: pass with minor fixes). Fixed: `Resource.release` without a request now throws `SimInvariantError`, capacity validated; the waiting queue no longer retains served waiters (this also sped the generator style up); `run()` rejects NaN and negative limits and never moves the clock backwards, delays must be finite; hash scratch buffer is per kernel with fixed byte order; stream keys are length-prefixed (golden hash changed `76703e06` -> `92b6d220`); events per customer and customers per second added to the benchmark and doc; unverified PLAN 5.2 assumptions and informal observations labelled; heap, Resource, clock and stream tests added; M/D/1 oracle and a deterministic-service agreement test added; tests and bench are now typechecked. Moved to S-003b: M/G/1, tandem, Little's law, M/M/4 delay probability and p99.
- Not done: try/finally for a process that throws while holding a server (documented contract instead).
- A1-A6 as defined in the master plan could not be read in this session (no document id); S-003b and the SG0 summary should check them against the master plan.
