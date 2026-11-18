# Spike A: engine kernel and measurements

Tickets S-003 (kernel, Node) and S-003b (Worker, Chromium, grading time, snapshot cost). The kernel code is kept (PLAN R12), not thrown away.

## What was built

`packages/engine`: `Kernel` (clock, event heap with a (time, seq) tie-break, streaming event-log hash), seeded streams (`stream(seed, componentId, purpose)` over pure-rand 8.4.2 xoroshiro128+), and one M/M/c station written twice: as plain callbacks and as generator processes (`hold`, `Resource.request`, `release`). The heap is our own structure-of-arrays heap; flatqueue was not needed.

## Results

Master plan criteria A1-A6 are defined in the master plan (Claude Docs), which this session could not read. Only the numbers repeated in `docs/PLAN.md` 9.4 were used; the rest is recorded as measured, not as pass or fail.

| Check | Result | Evidence |
| --- | --- | --- |
| M/M/1 at rho 0.5, 0.8, 0.9: mean within 5%, p99 within 10% | pass, both styles | `packages/engine/test/oracles.test.ts`. Tolerances apply to the pooled sample: 10 fixed seeds x 100k customers, first 10k of each dropped as warm-up. A single seed at rho 0.9 can be off by 15% |
| M/M/4 at rho 0.8: mean vs Erlang C within 5% | pass, both styles. Mean only; delay probability and p99 are not checked | same file |
| M/D/1 at rho 0.8: mean vs Pollaczek-Khinchine within 5% | pass, both styles | same file |
| M/G/1 at rho 0.7, Erlang-4 (cv 0.5) and hyperexponential (cv 2) service: mean vs Pollaczek-Khinchine within 10% | pass, both styles | same file |
| M/M/4 at rho 0.8: fraction of customers who wait vs Erlang C within 5% | pass, both styles | same file |
| Little's law: L = lambda W within 2% on a run that starts and ends empty, L from n(t) bookkeeping | pass, both styles | same file |
| Three M/M/1 stations in series at rho 0.7: mean total time vs sum of stations within 5% | pass (generator style only) | same file |
| Same seed gives the same event-log hash; different seeds differ | pass | same file |
| Golden hash on Node | `093382ef` (M/M/2, lambda 0.8, mu 1, 5000 customers, seed 7). It changed twice inside this spike: stream keys were length-prefixed, then `Math.log` was replaced (see Findings) | same file |
| Callback style and generator style are the same model | identical event-log hash and identical sojourn times for exponential service (M/M/2) and identical hash for deterministic service (M/D/2, which has more same-time events) | same file |
| Stream independence and collision | re-creating a stream reproduces it; draws from one stream do not change another; keys with `\|` or `:` in the component id do not collide | `kernel.test.ts` |
| Heap, Resource, clock rules | tested: growth past 1024 entries, ties in FIFO order, release without request throws, stuck processes are visible through `Resource.waiting`, the clock never moves backwards, NaN and infinite limits are rejected | `heap-resource.test.ts` |
| Throughput (PLAN 9.4: at least 5 M events/s) | callbacks **4.6 to 5.2 M events/s** (2.0 events per customer, about 2.5 M customers/s): borderline. generators **3.3 to 3.7 M events/s** (2.6 events per customer, about 1.3 to 1.4 M customers/s): below budget | `node packages/engine/bench/bench.ts`, Node 24.22.0, Intel i5-10300H, 1M customers per run, median of 5 runs, three repeats; the machine was not idle (load average about 3), so treat as plus or minus 10% |

Events per customer differ because a generator releasing a server schedules an extra wake-up event for the next waiter. Events per second therefore flatters the generator style; in customers per second it runs at about 55% of the callback speed. The event budget (PLAN 9.4, at most 5 M events per seed) buys fewer customers under the generator style.

## Browser results (S-003b)

Chromium 159.0.8154.6 (headless shell, Playwright 1.65.1) on the same laptop (Intel i5-10300H, 4 cores / 8 threads, Fedora; not idle, load average 2.5 to 3). Harness: `packages/engine/browser/` (page, module Worker, typed messages) and `packages/engine/test-browser/`.

| Check | Result | Evidence |
| --- | --- | --- |
| A3: event-log hash in a Chromium Worker equals the Node golden `093382ef`, both styles | **pass** (`npm run test:browser`, also a CI job) | `determinism.spec.ts` |
| A5: grade 5 seeds, one Worker per seed, about 5 M events per seed (the PLAN event budget) | **pass** against the 5 s budget: wall time 1.8 to 1.9 s (callbacks, 2.5 M customers per seed) and 2.0 to 2.1 s (generators, 1.9 M customers per seed), median of 3 | `measure.spec.ts`, `npm run measure:browser` |
| A5: single Worker, 5 M events | 1.39 s callbacks (3.6 M events/s), 1.28 s generators (3.9 M events/s) | same |
| A5 at 4x CPU throttle | **not measurable this way**: CDP `Emulation.setCPUThrottlingRate` slowed the main thread but not the Workers (single Worker 1.20 s and 1.31 s at 4x). A computed bound is 4 x about 2 s = about 8 to 9.5 s against the 15 s budget; this is arithmetic, not a measurement | same |
| A6: main-thread cost of one snapshot (10 nodes, 200 tokens, handler plus a clone as stand-in for deserialization), JS side only | p50 0.9 ms, p95 1.3 ms, max 10.8 ms (first frames, JIT warm-up) unthrottled; p50 1.4 ms, p95 2.6 ms, max 3.4 ms at 4x main-thread throttle. Budget 4 ms: pass at p95. Canvas raster cost is not included | same |

Limits of these numbers: one machine, no phone (S-008), a made-up snapshot (the real one comes with S-020), the sim in the Worker is M/M/4 and not a lab. 5 Workers on 4 physical cores run about 35% slower per Worker than one alone, which is already inside the numbers above.

## Findings

- **`Math.log` is not bit-identical across V8 versions.** For the same input (`Math.log(1 - 0.23562447698628275)`), Node 24.22 (V8 13.6) gives `-0.2686960883038554` and Chromium 159 gives `-0.26869608830385533`. The event-log hash includes raw time bits, so every golden hash differed between Node and Chromium. PLAN R13 assumed "Chrome and Node are both V8, so bit-identical"; that is false across versions. Fix: `rng/log.ts`, a logarithm built only from IEEE basic operations (exact on every engine), accurate to about 1e-15; ESLint now bans `Math.log`, `exp`, `pow`, `sin`, `cos` and the other transcendental functions in the engine packages (`Math.sqrt` and basic arithmetic stay allowed). Any later component needing exp, pow or trig (for example a Zipf sampler for `traffic.skew`) must use a deterministic implementation or be reviewed against this. Firefox and WebKit stay statistical-only (V9).
- The deterministic log costs about 20 to 27 ns more per call than `Math.log` (tight loop: 41 to 50 ns vs 19 to 23 ns). In the callback M/M/c this is one call per customer, about 5 to 15% of throughput; alternating runs on the loaded machine gave 3.6, 4.4, 4.4 M events/s with `Math.log` and 3.8, 2.9, 3.7 with the deterministic log. The Node throughput numbers earlier in this note (4.6 to 5.2 M events/s) were taken with `Math.log`; they were not re-measured on an idle machine.
- Informal observations, not backed by a committed script: a heap with one object per event ran at about 4.5 M events/s on the same machine and the structure-of-arrays heap at about 5 M, with the same golden hash; hashing the log costs a few percent, inside the noise.
- The first version of `Resource` kept every dequeued waiter reachable, which cost memory and made the generator style look slower (about 2.5 to 3.0 M events/s). The independent review of S-003 found it.
- In Chromium the generator style is not slower per event than callbacks (3.9 vs 3.6 M events/s in a single Worker). Per customer it still does 2.6 events instead of 2.0, so it grades about 25% fewer customers within the same event budget. ADR 0003 #2 stays: generators for components, state machines only if a measured lab needs it.
- The two styles gave identical logs in every case tested (continuous service times and deterministic ones). That is evidence, not proof: it does not cover other component shapes, so a rewrite of a component from generator to callbacks still needs its own golden-hash check.

## Input for SG0 (S-007)

- A1 to A6 as defined in the master plan could not be read; the PLAN-9.4 numbers pass: events/s is borderline on Node (4.6 to 5.2 callbacks, lower with the deterministic log), the grading time budget has a wide margin on this laptop (about 2 s vs 5 s), snapshot cost is inside 4 ms at p95.
- Not yet measured: the owner's phone (S-008) and a real lab-shaped model (the caching lab, S-070). The margin of 2.5x on the laptop is the number to watch on the phone.
- Recommendation from this spike: GO on the build-our-own engine; no result argues for adopting another engine. The owner decides at SG0.

## Assumptions from PLAN 5.2 that this spike did not verify

- "pure-rand 8 offers splittable or jumpable generators good enough for per-stream seeding": not examined. Streams are seeded by hashing, not by jump or split. S-015 decides.
- "flatqueue supports the tie-break key": not examined; flatqueue was not used (own heap).

## Not decided here

Whether the generator path meets the budget on a real lab-shaped model and on the owner's phone (S-070, S-008).

## Weak points to know

- Stream seeds are a 32-bit FNV-1a hash of the length-prefixed key; two different triples can still collide by chance, and pure-rand seeds xoroshiro128+ from a 32-bit integer.
- Firefox and WebKit were not run; PLAN R13 treats them as statistical (V9). Their `Math.sqrt` and basic arithmetic are IEEE, so the deterministic log should match there too, but that is untested.
- A process that throws while holding a server leaks it; the contract is documented on `Resource.release`, with no try/finally in the runtime.
- Not covered by oracles: p99 for M/M/4 and for M/G/1 (no simple closed form used), a tandem network in callback style, fan-out (V1 in S-022).
- `bench/bench.ts` is a script, not the perf test of PLAN 9.4 (no assertion, not in CI).
