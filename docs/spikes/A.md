# Spike A: engine kernel and measurements

Tickets S-003 (kernel, Node) and S-003b (Worker, Chromium, grading time, snapshot cost). The kernel code is kept (PLAN R12), not thrown away. Figures below are from the final code unless a row says otherwise.

## What was built

`packages/engine`: `Kernel` (clock, event heap with a (time, seq) tie-break, streaming event-log hash), seeded streams (`stream(seed, componentId, purpose)` over pure-rand 8.4.2 xoroshiro128+, keys length-prefixed), a deterministic logarithm (`rng/log.ts`), service-time distributions built from exponential draws, and an M/M/c station written twice: as plain callbacks and as generator processes (`hold`, `Resource.request`, `release`), plus a three-station tandem network (generator style). The heap is our own structure-of-arrays heap; flatqueue was not needed. The browser harness is in `packages/engine/browser/` and `test-browser/`.

## Correctness results

Master plan criteria A1-A6 are defined in the master plan (Claude Docs), which these sessions could not read. Only the numbers repeated in `docs/PLAN.md` 9.4 were used. All rows are in `packages/engine/test/oracles.test.ts` unless noted; tolerances apply to pooled samples (10 fixed seeds x 100k customers, first 10k of each dropped as warm-up; one seed alone at rho 0.9 can be off by 15%).

| Check | Result |
| --- | --- |
| M/M/1 at rho 0.5, 0.8, 0.9: mean within 5%, p99 within 10% | pass, both styles |
| M/M/4 at rho 0.8: mean vs Erlang C within 5%; p99 vs the closed form (W is 0 with probability 1 - C, else exponential, plus exponential service) within 10%; fraction of customers who wait vs Erlang C within 5% | pass, both styles |
| M/D/1 at rho 0.8: mean vs Pollaczek-Khinchine within 5% | pass, both styles |
| M/G/1 at rho 0.7, Erlang-4 (cv 0.5) and hyperexponential (cv 2) service: mean vs Pollaczek-Khinchine within 3% (observed about 1%) | pass, both styles |
| Service samplers: mean 1/mu and cv^2 (1, 0.25, 4, 0) within 2% over 2 M draws | pass |
| Little's law on a run that starts and ends empty: system L = lambda W (identity of the bookkeeping, 1e-9); queue Lq = lambda Wq within 2%; average busy servers = lambda / mu (theory value) within 2% | pass, both styles |
| Three M/M/1 stations in series at rho 0.7: mean total time = sum of the stations within 5%; Little's law on the network within 2% | pass (generator style only) |
| Same seed gives the same event-log hash; different seeds differ | pass |
| Callback style and generator style are the same model | identical event-log hash for exponential service (and identical sojourns), and identical hash for deterministic service |
| Golden hash on Node, M/M/2, lambda 0.8, mu 1, 5000 customers, seed 7 | `093382ef`. It changed twice inside this spike (stream keys length-prefixed; `Math.log` replaced), both before any release |
| Heap, Resource, clock rules, stream independence and key collisions, bad configuration rejected the same way in both styles | pass (`kernel.test.ts`, `heap-resource.test.ts`, `oracles.test.ts`) |

Not covered by oracles: a tandem network in callback style, fan-out (V1 in S-022), Little's law per boundary for the tandem (system only).

## Throughput on Node (PLAN 9.4: at least 5 M events/s)

Node 24.22.0, Intel i5-10300H (4 cores, 8 threads), load average about 1.1 during the runs, `node packages/engine/bench/bench.ts`, median of 5 runs, three repeats.

| What | M events/s | Customers per second |
| --- | --- | --- |
| Kernel only (heap, clock, closures; no RNG, no model) | 5.1 (4.7 to 5.2) | not applicable |
| M/M/4 as callbacks (2.0 events per customer) | 3.0 (2.6 to 3.1) | 1.5 M |
| M/M/4 as generator processes (2.6 events per customer) | 2.7 (2.4 to 2.8) | 1.0 M |

**The budget is not met for the M/M/c models on this laptop: about 40% short for callbacks and about 45% short for generators.** The bare kernel meets it. The gap is model work per event: random draws, the deterministic logarithm, the log hash and the bookkeeping for the oracles (n(t), busy servers, waits), none of which is optimized. Earlier, lighter versions of the same model reached 4.5 to 5.2 M events/s (callbacks, `Math.log`, less bookkeeping); that figure is not reproducible on the final code, and the reviewer could not reproduce it either on a near-idle machine (about 3.65 with `Math.log` swapped in). Whether this matters is decided by grading time (below), not by this number.

## Browser results (Chromium)

Chromium 159.0.8154.6 (headless shell, Playwright 1.65.1) on the same laptop, load average 1.5 to 4 during the runs. Harness: a module Worker with a typed message protocol.

| Check | Result |
| --- | --- |
| A3: results in a Chromium Worker equal results in Node, bit for bit: golden hash (both styles); hashes for deterministic, Erlang-4 and hyperexponential service (both styles); the tandem network; `deterministicLog` on about 50,000 inputs over the whole domain | **pass**, 7 specs in `npm run test:browser`, also a CI job |
| A5: grade 5 seeds, one Worker per seed, about 5 M events per seed (the PLAN event budget) | **pass** against the 5 s budget: median wall time 2.6 s (callbacks, 2.5 M customers per seed) and 2.7 s (generators, 1.9 M customers per seed); the earlier run of the same spec gave 1.9 s and 2.1 s, so the machine state moves it by about 40% |
| A5, single Worker, 5 M events | 1.7 s callbacks, 1.9 s generators in the latest run (3.0 and 2.7 M events/s, the same as on Node) |
| A5 at 4x CPU throttle | **not measurable this way**: CDP `Emulation.setCPUThrottlingRate` slows the main thread but not Workers (single Worker 1.8 s and 1.7 s throttled). A rough bound is 4 x 2.6 to 2.7 s = about 10.5 to 11 s against the 15 s budget; it assumes linear scaling and ignores the phone's core count, so it is arithmetic, not a measurement |
| A6: main-thread cost of one snapshot (10 nodes, 200 tokens; handler plus a `structuredClone` as a stand-in for deserialization), JS side only, 50 frames, Workers otherwise idle | latest run: p50 0.9 ms, p95 1.1 ms, max 1.4 ms unthrottled; p50 1.7 ms, p95 2.0 ms, max 3.9 ms at 4x main-thread throttle. An earlier run had a first-frame spike of 10.8 ms (JIT warm-up), so the per-frame budget of 4 ms is met at p95 and not on every first frame. Raster cost is not included |

Limits: one machine and no phone (S-008); the model in the Worker is M/M/4, not a lab, so the lab-shaped comparison of the two styles waits for the caching lab (S-070); the snapshot is invented (the real one comes with S-020); 5 Workers on 4 physical cores run slower per Worker than one alone, which is inside the numbers; Firefox and WebKit were not run.

## Findings

- **`Math.log` is not bit-identical across V8 versions.** For the same input (`Math.log(1 - 0.23562447698628275)`), Node 24.22 (V8 13.6) gives `-0.2686960883038554` and Chromium 159 gives `-0.26869608830385533`. The event-log hash includes raw time bits, so every golden hash differed between Node and Chromium. PLAN R13 assumed "Chrome and Node are both V8, so bit-identical"; that is false across versions. Fix: `rng/log.ts`, a logarithm built only from IEEE basic operations and exact powers of two, relative error at most 3.7e-16 (checked by the reviewer against a 200-bit reference), bit-identical in Node and Chromium on the inputs tested. ESLint bans the transcendental `Math` functions, `**` and destructuring from `Math` in the engine packages (checked with files that break each rule); `Math.sqrt` and basic arithmetic stay allowed. A later component needing exp, pow or trig (for example a Zipf sampler for `traffic.skew`) must use a deterministic implementation. Firefox and WebKit stay statistical-only (V9).
- The deterministic log costs about 20 to 27 ns more per call than `Math.log` (tight loop: 41 to 50 ns vs 19 to 23 ns); the models call it twice per customer (arrival and service). In alternating runs the slowdown of the whole callback model was about 15% and of the generator model about 10% (reviewer's runs).
- Informal observations, not backed by a committed script: a heap with one object per event ran at about 10% less than the structure-of-arrays heap with the same golden hash; one random draw costs about 35 ns with `Math.log`.
- The first version of `Resource` kept every dequeued waiter reachable (found by the S-003 review) and made the generator style look slower.
- The generator style does 2.6 events per customer instead of 2.0 (the extra wake-up when a server is released to a waiter), so it grades about 25% fewer customers within the same event budget. Per event it ran about 10% slower than callbacks on Node. ADR 0003 #2 stays: generators for components, state machines only if a measured lab needs it.
- The two styles gave identical logs in every case tested. That is evidence, not proof: it does not cover other component shapes, so a rewrite of a component from generator to callbacks needs its own golden-hash check.

## Input for SG0 (S-007)

- Criteria A1 to A6 as the master plan defines them were not checked; against the numbers in PLAN 9.4: **events/s is not met by the M/M/c models on this laptop (3.0 and 2.7 vs 5; the bare kernel does 5.1); grading time passes with margin about 2x unthrottled (2.6 to 2.7 s vs 5 s); snapshot cost passes at p95 (1.1 ms, 2.0 ms throttled, vs 4 ms); determinism between Node and Chromium passes** (after the `Math.log` fix).
- Not measured: the owner's phone (S-008) and a real lab-shaped model (the caching lab, S-070). The 2x margin on a laptop is the number to watch on a phone; if the phone is 3x slower per core than this laptop, grading takes about 8 s, over the 5 s budget but inside the 15 s throttled budget.
- Risks to weigh: model work per event (not the kernel) is what misses the 5 M events/s figure, so component code needs profiling when it exists (S-022); lowering the event budget per seed or fewer seeds are the cheap levers.
- The spike gives no reason to adopt another engine. The recommendation (build our own) is the owner's decision at SG0.

## Assumptions from PLAN 5.2 that this spike did not verify

- "pure-rand 8 offers splittable or jumpable generators good enough for per-stream seeding": not examined. Streams are seeded by hashing, not by jump or split. S-015 decides.
- "flatqueue supports the tie-break key": not examined; flatqueue was not used (own heap).

## Weak points to know

- Stream seeds are a 32-bit FNV-1a hash of the length-prefixed key; two different triples can still collide by chance, and pure-rand seeds xoroshiro128+ from a 32-bit integer.
- A process that throws while holding a server leaks it; the contract is documented on `Resource.release`, with no try/finally in the runtime.
- `bench/bench.ts` and `measure.spec.ts` are scripts, not the perf tests of PLAN 9.4 (no assertions, not in CI).
- The CI job `browser` has not run on GitHub yet.
