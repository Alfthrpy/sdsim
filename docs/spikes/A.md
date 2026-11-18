# Spike A: engine kernel (part 1, Node)

Ticket S-003. Part 2 (Worker bridge, Chromium determinism, grading time, snapshot cost) is S-003b. The kernel code is kept (PLAN R12), not thrown away.

## What was built

`packages/engine`: `Kernel` (clock, event heap with a (time, seq) tie-break, streaming event-log hash), seeded streams (`stream(seed, componentId, purpose)` over pure-rand 8.4.2 xoroshiro128+), and one M/M/c station written twice: as plain callbacks and as generator processes (`hold`, `Resource.request`, `release`). The heap is our own structure-of-arrays heap; flatqueue was not needed.

## Results

Master plan criteria A1-A6 are defined in the master plan (Claude Docs), which this session could not read. Only the numbers repeated in `docs/PLAN.md` 9.4 were used; the rest is recorded as measured, not as pass or fail.

| Check | Result | Evidence |
| --- | --- | --- |
| M/M/1 at rho 0.5, 0.8, 0.9: mean within 5%, p99 within 10% | pass, both styles | `packages/engine/test/oracles.test.ts`, 10 fixed seeds x 100k customers, first 10k dropped |
| M/M/4 at rho 0.8: mean vs Erlang C within 5% | pass, both styles | same file |
| Same seed gives the same event-log hash; different seeds differ | pass | same file |
| Golden hash on Node | `76703e06` (M/M/2, lambda 0.8, mu 1, 5000 customers, seed 7) | same file |
| Callback style and generator style are the same model | identical event-log hash and identical sojourn times | same file |
| Stream independence | drawing from one stream does not change another | `kernel.test.ts` |
| Throughput (PLAN 9.4: at least 5 M events/s) | callbacks 4.5 to 5.2 M events/s: **borderline**. generators 2.5 to 3.0 M events/s: **below budget** | `node packages/engine/bench/bench.ts`, Node 24.22.0, Intel i5-10300H, 5 runs of 1M customers (2M events) per style, median of 5; several repeats because the machine was not idle (load average about 3) |

## Findings

- The heap shape matters. An object per event gave about 4.5 M events/s; a structure-of-arrays heap raised it to about 5 M with the same golden hash. Logging into the hash costs little (a few percent, inside the noise). Random draws are cheap (about 35 ns each).
- Generator processes run at about 55% of the callback speed (allocation of generators and command objects per customer). ADR 0003 #2 expected some overhead and named the fallback: rewrite hot components as state machines behind the same descriptor. This number does not decide that yet, because the budget that matters is grading time (A5) for the heaviest lab. A rough, unmeasured estimate: 5 seeds x 5 M events at 2.7 M events/s is about 9 s on one thread, about 1.5 to 2 s with one Worker per seed on 8 cores. The phone has not been measured; S-003b measures A5 in a Worker and S-008 collects the phone.
- The two styles give bit-identical logs, so a component can start as a generator and be rewritten as callbacks later with a golden-hash check.

## Not decided here

Whether the generator path meets the budget. That needs A5 on a real lab-shaped model in a Worker (S-003b) and the owner's phone (S-008).

## Weak points to know

- Stream seeds are a 32-bit FNV-1a hash of `seed|componentId|purpose`; two different triples can collide, and pure-rand seeds xoroshiro128+ from a 32-bit integer. Fine for a spike; S-015 decides whether to widen it.
- Throughput numbers come from a loaded laptop. Treat them as plus or minus 10%.
