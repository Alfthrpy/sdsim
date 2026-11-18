---
id: S-003b
title: "Spike A part 2: Worker bridge, Chromium determinism, A5 and A6"
milestone: S0
type: spike
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-003]
estimate: 1
outputs:
  - packages/engine/src/worker
  - docs/spikes/A.md
---

## Context

Second half of PLAN S-003 (split when S-003 was claimed, because the ticket did not fit one session). S-003 built the kernel and measured Node; this ticket proves it in a browser Worker. SG0 (S-007) depends on both.

## Tasks

1. Worker bridge: the engine in a module Worker, typed `postMessage` protocol (init, run, result), the Worker entry kept outside the engine's pure code.
2. Determinism in Chromium (A3): run the golden scenario in Chromium through Playwright and compare the event-log hash with the Node golden `76703e06`.
3. A5: grading time for a lab-shaped model (5 seeds, one Worker per seed) in Chromium, also with CPU throttling at 4x; compare with the 5 s and 15 s budgets in PLAN 9.4.
4. A6: main-thread cost of one snapshot at 10 Hz against the 4 ms budget.
5. Update `docs/spikes/A.md` with results, including a go or no-go input for SG0.

## Done criteria

- [ ] The golden hash matches between Node and Chromium
- [ ] A5 and A6 are measured and recorded in `docs/spikes/A.md`, with the machine and browser versions
- [ ] Playwright is added as a dependency by this ticket and noted in it
- [ ] `python scripts/validate.py` passes; lint, typecheck, tests pass

## Notes

(Filled in during the work.)
