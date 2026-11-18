# Spike A: engine kernel (part 1, Node)

Ticket S-003. Part 2 (Worker bridge, Chromium determinism, grading time, snapshot cost) is S-003b. The kernel code is kept (PLAN R12), not thrown away.

## What was built

`packages/engine`: `Kernel` (clock, event heap with a (time, seq) tie-break, streaming event-log hash), seeded streams (`stream(seed, componentId, purpose)` over pure-rand 8.4.2 xoroshiro128+), and one M/M/c station written twice: as plain callbacks and as generator processes (`hold`, `Resource.request`, `release`). The heap is our own structure-of-arrays heap; flatqueue was not needed.

## Results

Master plan criteria A1-A6 are defined in the master plan (Claude Docs), which this session could not read. Only the numbers repeated in `docs/PLAN.md` 9.4 were used; the rest is recorded as measured, not as pass or fail.

| Check | Result | Evidence |
| --- | --- | --- |
| M/M/1 at rho 0.5, 0.8, 0.9: mean within 5%, p99 within 10% | pass, both styles | `packages/engine/test/oracles.test.ts`. Tolerances apply to the pooled sample: 10 fixed seeds x 100k customers, first 10k of each dropped as warm-up. A single seed at rho 0.9 can be off by 15% |
| M/M/4 at rho 0.8: mean vs Erlang C within 5% | pass, both styles. Mean only; delay probability and p99 are not checked | same file |
| M/D/1 at rho 0.8: mean vs Pollaczek-Khinchine within 5% | pass, both styles | same file |
| Same seed gives the same event-log hash; different seeds differ | pass | same file |
| Golden hash on Node | `92b6d220` (M/M/2, lambda 0.8, mu 1, 5000 customers, seed 7). It was `76703e06` before stream keys were length-prefixed (behavior change in this ticket, not after it) | same file |
| Callback style and generator style are the same model | identical event-log hash and identical sojourn times for exponential service (M/M/2) and identical hash for deterministic service (M/D/2, which has more same-time events) | same file |
| Stream independence and collision | re-creating a stream reproduces it; draws from one stream do not change another; keys with `\|` or `:` in the component id do not collide | `kernel.test.ts` |
| Heap, Resource, clock rules | tested: growth past 1024 entries, ties in FIFO order, release without request throws, stuck processes are visible through `Resource.waiting`, the clock never moves backwards, NaN and infinite limits are rejected | `heap-resource.test.ts` |
| Throughput (PLAN 9.4: at least 5 M events/s) | callbacks **4.6 to 5.2 M events/s** (2.0 events per customer, about 2.5 M customers/s): borderline. generators **3.3 to 3.7 M events/s** (2.6 events per customer, about 1.3 to 1.4 M customers/s): below budget | `node packages/engine/bench/bench.ts`, Node 24.22.0, Intel i5-10300H, 1M customers per run, median of 5 runs, three repeats; the machine was not idle (load average about 3), so treat as plus or minus 10% |

Events per customer differ because a generator releasing a server schedules an extra wake-up event for the next waiter. Events per second therefore flatters the generator style; in customers per second it runs at about 55% of the callback speed. The event budget (PLAN 9.4, at most 5 M events per seed) buys fewer customers under the generator style.

## Findings

- Informal observations, not backed by a committed script: a heap with one object per event ran at about 4.5 M events/s on the same machine and the structure-of-arrays heap at about 5 M, with the same golden hash; hashing the log costs a few percent, inside the noise; one random draw costs about 35 ns.
- The first version of `Resource` kept every dequeued waiter reachable, which cost memory and made the generator style look slower (about 2.5 to 3.0 M events/s). The independent review found it; after the fix the figures above were measured.
- ADR 0003 #2 expected generator overhead and named the fallback: rewrite hot components as state machines behind the same descriptor. This number does not decide that yet, because the budget that matters is grading time (A5) for the heaviest lab. A rough, unmeasured estimate: 5 seeds x 5 M events at 3.5 M events/s is about 7 s on one thread, about 1 to 1.5 s with one Worker per seed on 8 cores. The phone has not been measured; S-003b measures A5 in a Worker and S-008 collects the phone.
- The two styles gave identical logs in every case tested (continuous service times and deterministic ones). That is evidence, not proof: it does not cover other component shapes, so a rewrite of a component from generator to callbacks still needs its own golden-hash check.

## Assumptions from PLAN 5.2 that this spike did not verify

- "pure-rand 8 offers splittable or jumpable generators good enough for per-stream seeding": not examined. Streams are seeded by hashing, not by jump or split. S-015 decides.
- "flatqueue supports the tie-break key": not examined; flatqueue was not used (own heap).

## Not decided here

Whether the generator path meets the budget. That needs A5 on a real lab-shaped model in a Worker (S-003b) and the owner's phone (S-008).

## Weak points to know

- Stream seeds are a 32-bit FNV-1a hash of the length-prefixed key; two different triples can still collide by chance, and pure-rand seeds xoroshiro128+ from a 32-bit integer.
- `Math.log` is used by `exponential`. V8 gives the same results in Node and Chromium; the spec does not require that of other engines, and the log hash includes raw time bits. PLAN R13 already treats Firefox and WebKit as statistical.
- A process that throws while holding a server leaks it; the contract is documented on `Resource.release`, with no try/finally in the runtime.
- Not yet covered by oracles: M/G/1 with cv other than 1 or 0, tandem networks, Little's law as an invariant (moved to S-003b).
- `bench/bench.ts` is a script, not the perf test of PLAN 9.4 (no assertion, not in CI).
