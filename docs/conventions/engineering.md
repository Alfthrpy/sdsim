# Engineering conventions

Rules every code ticket follows. The toolchain, versions, performance budgets and the definition of done are in [`../PLAN.md`](../PLAN.md); this file holds the principles that do not change with the tools. Sources: the STUD Simulator Master Plan sections 4 (architecture), 5 (contract) and 7 (validation).

## Layers and dependencies

| Layer | Package | May depend on | Runs in |
| --- | --- | --- | --- |
| L0 Contract | `contract/` | nothing at runtime; built from component descriptors | build time; vendored into `sdlab` |
| L1 Engine (kernel) | `packages/engine` | nothing | Worker; Node (tests, CLI) |
| L1' Components | `packages/components` | L1 | Worker; Node |
| L2 Lab runtime | `packages/lab-runtime` | L0, L1, L1' | Worker; Node (lab CI) |
| L2' CLI | `packages/cli` | L0, L1, L1', L2 | Node |
| Sandbox | `sandbox/` | public entry points of L1, L1', L2' only; nothing imports it | Node (CLI) |
| L3 UI | `packages/ui`, `apps/web` | L0, L2 (by messages) | Main thread |

A dependency pointing the other way, or the UI importing the engine directly, is a defect.

## The engine is pure and deterministic

- No DOM, no wall clock (`Date.now`, `performance.now`), no `Math.random`, no global mutable state.
- No `Math.log`, `exp`, `pow`, trig or other transcendental functions: their last bit differs between V8 versions (found in spike A: Node 24 vs Chromium 159), which breaks the golden hash. Use basic arithmetic, `Math.sqrt`, or the deterministic functions in `packages/engine/src/rng/`. ESLint enforces this.
- All randomness comes from named seeded streams, so adding a random draw in one component does not change another component's sequence.
- Same spec + same seed = same event log, byte for byte, within one JavaScript engine: Node and Chromium must give the same event-log hash (tested in CI). Firefox and WebKit are compared statistically, not bitwise (PLAN R13). The event-log hash is the determinism test.
- Time is simulated time. Snapshots for the UI are sampled; the UI never drives the simulation clock.

## Honesty labels

Every catalog entry (component, policy, scenario, metric) is one of:

- `modeled`: the behavior is reproduced and **evidence exists**: an oracle test against queueing theory, a reproduction of a published result, or documented product behavior. The entry names the check that proves it.
- `illustrative`: the shape is right, the numbers are not. Labs using it say so (`illustrative: true` plus an Indonesian note).
- `not-modeled`: the simulator does not do this. A lab spec that uses it is an error.

Do not upgrade a label without new evidence. Numbers shown to learners are labelled illustrative unless a source supports them. Grading uses relative behavior and thresholds, never absolute product numbers.

## Testing

- **Oracle tests**: compare simulated results with closed-form queueing results (for example Little's law within a tolerance, M/M/1, M/M/c, M/G/1, tandem networks) over many seeds. Tolerances are stated in the test, not tuned until it passes.
- **Determinism tests**: same seed, same hash; different seeds, different logs.
- **Golden tests**: for labs, the reference solution passes and every listed wrong answer fails, over the fixed grading seeds.
- **Property tests** for invariants (no negative queue length, conservation of requests, monotone clock).
- A failing oracle or determinism test blocks the ticket. A flaky test is a bug, not noise: fix the cause or delete the test with a note.

## Contract

- The contract is versioned with semver. A change that can invalidate an existing lab spec is a major (or, before 1.0, a minor with a note) change.
- It is frozen at 1.0.0 only after the vertical slice has validated it; before that, labs declare `contract_version: "0.x.y"`.
- `catalog.json` is generated from sources of truth in this repo; it is never edited by hand downstream. `sdlab` pins a released version and checks its lab specs against that version's JSON Schema and catalog.
- Learner-facing strings are keys into `contract/i18n/id.yaml`; code contains no Indonesian prose.

## Code quality

- Small modules with one responsibility; no dead code; no speculative generality. Name things after the domain (queue, server, retry, breaker), not after the implementation.
- Errors on malformed input are values or typed errors with a clear message, never a crash with a stack trace for a user mistake.
- Performance budgets in `PLAN.md` are tests, not wishes.
- Dependencies are added only when they pay for themselves, pinned, and noted in the ticket.
