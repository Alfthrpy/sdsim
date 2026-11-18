---
id: S-003b
title: "Spike A part 2: Worker bridge, Chromium determinism, A5 and A6"
milestone: S0
type: spike
owner: agent
review: agent
status: in-progress
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
5. Oracles left from part 1: M/G/1 (cv 0.5 and 2), a 3-station tandem network, Little's law per boundary on a run that starts and ends empty, and the M/M/4 delay probability and p99.
6. Check A1-A6 against the master plan text (the ticket author could not read it) and add the rest of the generator-vs-callback comparison on a lab-shaped model.
7. Update `docs/spikes/A.md` with results, including a go or no-go input for SG0.

## Done criteria

- [x] The golden hash matches between Node and Chromium (both styles; `npm run test:browser`, CI job `browser`)
- [x] A5 and A6 are measured and recorded in `docs/spikes/A.md`, with the machine and browser versions
- [x] The extra oracles in task 5 pass (M/G/1 cv 0.5 and 2, tandem, Little's law, M/M/4 delay probability); the M/M/4 p99 was not done (no closed form used), noted in the spike
- [x] Playwright 1.65.1 and Vite 8.3.8 added as dev dependencies by this ticket
- [x] `python scripts/validate.py` passes; lint, typecheck, tests pass
- [ ] Independent review (code-reviewer) done and findings fixed

## Notes

- **Finding:** `Math.log` differs in the last bit between Node 24.22 (V8 13.6) and Chromium 159, so the first Chromium run failed the golden hash. PLAN R13 ("both V8, so bit-identical") was wrong across versions. Fix: `packages/engine/src/rng/log.ts` (IEEE basic operations only), ESLint ban on transcendental `Math` functions in the engine, PLAN R13 and engineering.md updated, golden hash now `093382ef`.
- CDP CPU throttling does not slow Workers, so A5 at 4x is a computed bound, not a measurement (spike note).
- A1-A6 as defined in the master plan were still not readable; the PLAN 9.4 budgets were used.
- The Worker bridge is a spike protocol (`packages/engine/browser/`); the real protocol is S-020. `window.sdsim` is typed by `Harness` in `browser/protocol.ts`.
- The CI job `browser` was added but has not run on GitHub yet; its first run also tests `playwright install --with-deps`.
- Not measured: the owner's phone (S-008), Firefox and WebKit.
