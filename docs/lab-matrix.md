# Lab matrix (S-011)

Input to **OD-4** (the v1 lab list). The owner decides; nothing here changes `sdlab` by itself. A lab is valid only in the intersection of what `sdlab` wants taught and what the catalog can simulate honestly (master plan 5.1).

- **Read on 2026-11-19:** `sdlab` `curriculum/concepts.yaml` at commit `55a509d` (50 concepts); the STUD Simulator Master Plan (Claude Docs, rev 97): component table 4.3, scenarios 4.4, metrics 4.5, grounding table R3, lab table R5; this repo's `docs/PLAN.md` and ADR 0003.
- **Count:** 25 concepts list `lab` in `formats` (`docs/HANDOFF.md` says 24; the file says 25).
- **What "planned label" means.** Only the single-station queueing kernel exists today (S-003: M/M/1, M/M/c and Little's-law oracles). No component exists yet. A label below is the one the catalog will carry **if its evidence test passes** (master plan R3 and 7.1), not a claim that it is earned. Where the master plan marks something `illustrative` or leaves it out, this matrix says so.
- **Objective codes.** `M` the objective can be practiced in the planned catalog (modeled). `I` only through an illustrative behavior. `T` text, quiz or debrief only: the simulator cannot show it. `?` depends on a catalog detail the plan does not fix (listed in "Catalog gaps").

## 1. Recommendation at a glance

**Proposed v1 list: 16 labs** (master plan target: 16). Of the 25 concepts that list `lab`: 16 own a lab, 3 become secondary concepts of another lab, 5 lose `lab` (not modelable), 1 is deferred.

| Recommendation | Concepts | `sdlab` edit |
| --- | --- | --- |
| **Keep** (own a lab) | `single-machine-limits`, `latency-throughput`, `load-balancer-reverse-proxy`, `caching-basics`, `idempotency`, `rate-limiting`, `replication`, `partitioning-sharding`, `message-queue`, `delivery-semantics`, `consistency-models`, `timeouts`, `retry-backoff-jitter`, `circuit-breaker`, `load-shedding`, `cascading-failure` | none (each lab states which objectives it practices, section 4) |
| **Merge** (secondary concept of another lab) | `connection-pooling` into `single-machine-limits` (OD-5, already decided), `littles-law` into `latency-throughput`, `backpressure-consumer-lag` into `message-queue` | none: `scripts/validate.py` accepts a concept named in `secondary_concepts` as having its lab, so `formats` stays |
| **Drop `lab`** (default of OD-4: not modelable) | `indexes-query-basics` (also OD-5), `replication-lag-failover`, `isolation-levels`, `locks-leases-fencing`, `distributed-transactions` | remove `lab` from `formats` |
| **Defer** (modelable, but not in the 16) | `capacity-headroom` | remove `lab` now (else `validate.py` fails the concept once it reaches `review`); add it back when a lab is scheduled |
| **Candidates** (no `lab` today) | `percentiles-tail-latency` (modelable; 17th lab if the owner wants it), `metastable-failure` (after S-041), a second caching lab (staleness), `cdn` and `cache-stampede-hot-keys` (no) | owner's call, section 3 |

Differences from the master plan's 16 (L01 to L16): L03 (`percentiles`) and L06 (`cdn`) are not in `sdlab`'s `lab` list and are not in this 16; `rate-limiting` and `retry-backoff-jitter` get their own labs because `sdlab` lists `lab` for both and their objectives differ from their partner's (`load-shedding`, `timeouts`); L16 is `cascading-failure` only.

## 2. The matrix (25 concepts that list `lab`)

"Tickets" are the engine tickets in `docs/PLAN.md` section 8 that the lab needs beyond the vertical slice (S-021, S-022, S-023a, S-025a). "Obj." counts objectives practiced in the lab over the concept's objectives.

| Unit | Concept | MP id | Obj. | Planned label | Components, policies, scenarios | Tickets | Role | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `indexes-query-basics` | none (R5: quiz-only) | 0/3 | `not-modeled` | would need a query-cost model | none | none | **Drop `lab`** |
| 0 | `connection-pooling` | L01 | 2/3 | modeled; pool contention illustrative (A-M4) | `client`, `api-server`, `db` pool; `traffic-spike` | none (slice) | secondary of `single-machine-limits` | **Merge** |
| 0 | `single-machine-limits` | L01 | 3/3, CPU, memory and disk as text | modeled (threads, pool) | same as above | none (slice) | owner | **Keep** (OD-5; the owner writes the spec) |
| 1 | `latency-throughput` | L02 | 2/2 | modeled (oracle) | `client`, `api-server`; `traffic-spike`; `in_flight`, `utilization`, latency percentiles | none (slice) | owner | **Keep** |
| 1 | `littles-law` | L02 | 2/2 | modeled (oracle) | same lab; metric `in_flight` | none | secondary of `latency-throughput` | **Merge** |
| 1 | `capacity-headroom` | none | 2/2 | modeled | same components; `traffic-spike` | none | none | **Defer** |
| 2 | `load-balancer-reverse-proxy` | L04 | 2/3 | modeled | `load-balancer` (round-robin, random, least-outstanding; health checks), `api-server` x n; `instance-crash` | S-026, S-030b | owner | **Keep**, narrowed |
| 2 | `caching-basics` | L05 | 2/3 | modeled | `cache`, `db`; `cache-flush` | S-024, S-030a (BG1) | owner | **Keep** (spec exists) |
| 2 | `idempotency` | L07 | 2/3 | modeled | `client` retries + `idempotency-key`, `db`; `slow-dependency`; `duplicate_effects` | S-023b, S-030b | owner | **Keep**, narrowed |
| 2 | `rate-limiting` | none (in L15) | 1/4 | modeled (token bucket) | `rate-limiter` (rate, burst); `traffic-spike`; `shed_rate` | S-028 | owner | **Keep**, narrowed |
| 3 | `replication` | L08 | 2/3 | modeled | `db` replicas 0 to 3, apply stream; `write-burst`; `replica_lag`, `stale_read_ratio` | S-025c, S-030b | owner | **Keep**, narrowed |
| 3 | `replication-lag-failover` | none (R3: failover not in v1) | 1/3 | partly `modeled`, failover `not-modeled` | would need read routing and failover | none | none | **Drop `lab`** |
| 3 | `partitioning-sharding` | L09 | 2/3 | modeled (qualitative ground truth) | `db` partitions 1 to 8, key map; `hot-key`; per-partition `utilization` | S-031 | owner | **Keep**, narrowed |
| 3 | `isolation-levels` | none (R5: quiz-only) | 0/2 | `not-modeled` | anomalies are not a queueing behavior | none | none | **Drop `lab`** |
| 4 | `message-queue` | L10 | 2/3 | modeled | `queue`, `worker`; `traffic-spike`; `queue_length`, `queue_age` | S-016, S-027 | owner | **Keep**, narrowed |
| 4 | `delivery-semantics` | L11 | 2/3 | modeled | `queue` (visibility timeout), `worker` (idempotent); `duplicate_effects` | S-027 | owner | **Keep**, narrowed |
| 4 | `backpressure-consumer-lag` | L10 | 2/3 | modeled | same lab as `message-queue` | S-016, S-027 | secondary of `message-queue` | **Merge** |
| 5 | `consistency-models` | L12 | 1/3 | modeled, failure-free | `db` quorum (N, R, W); `write-burst`; `stale_read_ratio` | S-031 | owner | **Keep**, narrowed (Unit 5: "only where honest") |
| 5 | `locks-leases-fencing` | none (R5) | 0/3 | `not-modeled` | clocks, pauses, fencing tokens | none | none | **Drop `lab`** |
| 5 | `distributed-transactions` | none (R5) | 0/3 | `not-modeled` | two-phase commit, sagas | none | none | **Drop `lab`** |
| 6 | `timeouts` | L13 | 2/3 | modeled | `client` timeout and retries, `api-server` threads, `external-dependency`; `slow-dependency`, `dependency-errors` | S-023b, S-028, S-030b | owner | **Keep**, narrowed |
| 6 | `retry-backoff-jitter` | L13 | 2/3 | modeled | `client` retries, backoff, jitter, budget; `dependency-errors`; `amplification` | S-023b, S-030b | owner | **Keep**, narrowed |
| 6 | `circuit-breaker` | L14 | 1/2 | modeled | breaker policy, `external-dependency`; `slow-dependency`; `breaker_open_time` | S-029, S-030b | owner | **Keep**, narrowed |
| 6 | `load-shedding` | L15 | 1/3 | modeled | `api-server` concurrency limit and queue bound, `rate-limiter`; `traffic-spike`; `goodput_rps`, `shed_rate` | S-028 | owner | **Keep**, narrowed |
| 6 | `cascading-failure` | L16 | 2/3 | modeled | `api-server` pools, `external-dependency`; `slow-dependency`, `traffic-spike`; `amplification` | S-023b, S-030b | owner | **Keep**, narrowed |

Why `load-balancer-reverse-proxy` is 2/3 and not 3/3, and so on, is in section 4.

## 3. Candidates that do not list `lab`

| Concept | Verdict | Reason |
| --- | --- | --- |
| `percentiles-tail-latency` (master plan L03) | **Modelable; owner's call.** Would be the 17th lab | Objectives 2 and 3 are practicable: the mean hides slow requests, and the chance that a user meets a slow request grows with fan-out (`api-server` fan-out k, wait for all or first r; ground truth: tail-at-scale, master plan R3, planned `modeled`). Objective 1 (compute p50, p95, p99 from data) is text. Needs S-022 only (fan-out is part of `api-server`). `sdlab` left `lab` off at G1 |
| `metastable-failure` (part of L16) | **Not yet.** Revisit after S-041 | The label is "modeled after spike B": it is `modeled` only if V4(a), the HotOS '25 reproduction, passes. If it passes, a lab can stay a second lab of `cascading-failure`; if not, it stays `illustrative` or text. Do not write the spec before then |
| Second caching lab: staleness and write path | **Later, blocked by a design choice** | `caching-basics` objective 1 (cache-aside vs write-through) and the TTL staleness trade-off need a write path and `stale_read_ratio`. ADR 0003 #4 leaves the cache write path open (invalidate or wait for TTL), and R22 names S-025c. Decide the write path when this lab is specified |
| `cdn` (master plan L06) | **No lab** | Objectives are about content types and `Cache-Control` / `ETag` headers (text). The one simulable part, an RTT saving at the edge, repeats the cache mechanism of `caching-basics` with an illustrative constant |
| `cache-stampede-hot-keys` | **No lab** | The simulator has coalescing and `cache-flush`, but not TTL jitter, background refresh or a multi-node cache, so two of its three objectives are text. It is better served by an incident (GCP Service Control uses a herd) than by a tune lab |

## 4. Per concept: what the lab can and cannot practice

Objectives are paraphrased from `concepts.yaml` (Indonesian in the source). Each "Keep, narrowed" row says what must stay out of the lab spec. Everything marked `T` stays in the lesson, quiz and debrief; the lab must not imply it was simulated.

**Unit 0**

- `indexes-query-basics`: 1 read `EXPLAIN` `T`; 2 choose an index column `T`; 3 index cost on writes `T`. No query-cost model exists (master plan R5, OD-5). **Drop `lab`.**
- `connection-pooling`: 1 why a new connection per request is wasteful `?` (no connection-setup cost in the `db` descriptor, gap G10); 2 size a pool from cores, query load and the database limit, then validate `M` for the pool and queue, `T` for cores (no CPU model), and "more connections are not faster" is illustrative (A-M4, S-025b, not in early access); 3 diagnose pool exhaustion `M` (queue wait for a connection, `utilization`, `queue_age`). **Merge** into the Unit 0 lab (OD-5).
- `single-machine-limits`: 1 tell which of CPU, memory, disk, connections is the bottleneck `M` for threads and connections only; 2 USE method on one resource `M` (utilization, saturation as queue, errors); 3 vertical scaling enough? `M` for threads and instances, no price or machine-size ceiling in the catalog. The spec must say CPU, memory and disk are not simulated (OD-5).

**Unit 1**

- `latency-throughput`: 1 latency vs throughput `M`; 2 latency rises sharply near full utilization `M` (M/M/c oracle, the one behavior with a test today). One lab, owner of L02.
- `littles-law`: 1 use L = λW `M` (`in_flight` is the metric); 2 size a thread pool or queue from target throughput and latency `M`. Shares the L02 lab as a second target.
- `capacity-headroom`: 1 compute headroom from a measured peak and measured capacity `M`; 2 decide from numbers whether one server still suffices `M`. Modelable and cheap, but it repeats L01 and L02 mechanics. **Defer.**

**Unit 2**

- `load-balancer-reverse-proxy`: 1 one address serving many instances, TLS termination, routing, buffering `T`; 2 choose round-robin, least connections, or hash `M` for round-robin, random, least-outstanding (the catalog has no `hash`, gap G12); 3 health checks `M` (the error window equals the detection delay); the load balancer as a single point of failure `?` (gap G4). Narrowed to objective 2 and health checks.
- `caching-basics`: spec exists. Practices objectives 2 and 3 (capacity and TTL against database load; hit ratio). Objective 1 (cache-aside vs write-through) and staleness `T` until the second lab.
- `idempotency`: 1 which operations are idempotent, HTTP methods `T`; 2 design an idempotency key `I`/`T` (the catalog has a key on or off, not its design); 3 retry without a key duplicates the effect `M` (`duplicate_effects`, commit-then-timeout duplicates). Narrowed to objective 3 and key on/off.
- `rate-limiting`: 1 compare token bucket, fixed window, sliding window `T` except the token bucket (gap G7); 2 where the limit sits and the key `?` (per client or global; placement by topology); 3 shared counters across instances `T` (gap G7); 4 429 and `Retry-After` `T`. Only burst and rate of a token bucket are practiced. Honest but thin: keep only if the owner wants a small lab in Unit 2.

**Unit 3**

- `replication`: 1 leader and followers, sync or async `M` (async, or quorum with W = N); 2 when a read replica is enough to cut read load `M`; 3 what happens to unreplicated writes when the leader dies `T` (failover is not in the v1 catalog, master plan R3). Narrowed to objectives 1 and 2.
- `replication-lag-failover`: 1 read-your-writes failures and mitigation `?`; 2 monotonic reads and mitigation `?`; 3 manual failover, split brain, fencing `T`. `replica_lag` and `stale_read_ratio` show the symptom, but the mitigations (read from the leader after a write, bind a user to one replica) need read routing the catalog does not have (gap G3). The symptom is already shown in the `replication` lab. **Drop `lab`.**
- `partitioning-sharding`: 1 choose a key, hot partition risk `M` (qualitative, `hot-key`); 2 range vs hash `?` (the key-to-partition map has no stated options, gap G2); 3 cost of sharding, cross-shard queries, rebalancing `T`. Narrowed to 1, and 2 only if S-031 adds the map options.
- `isolation-levels`: 1 recognize anomalies `T`; 2 choose a level or lock `T`. **Drop `lab`.**

**Unit 4**

- `message-queue`: 1 which work to move off the request path `M` in outline (a producer gets a `handoff` reply, so the request path shortens); 2 visibility timeout, acknowledgement, competing consumers `M`; 3 dead-letter queue for repeatedly failing messages `?` (the `worker` descriptor has no failure or poison-message parameter, gap G1). Narrowed to 1 and 2.
- `backpressure-consumer-lag`: 1 diagnose a growing queue from `queue_age` and lag `M`; 2 add consumers or limit the producer `M` (consumers 1 to 50; producer rate is a client edit); 3 backpressure vs load shedding `T` (the debrief; shedding is practiced in `load-shedding`). Merged: the same topology and metrics as `message-queue`.
- `delivery-semantics`: 1 three semantics, when messages are lost or duplicated `M` for at-least-once duplicates, `T` for at-most-once loss (no acknowledge-before-process or worker crash, gap G1); 2 design an idempotent consumer `I`/`T` (flag on or off); 3 exactly-once is at-least-once plus idempotent processing `M` (`duplicate_effects` with the flag off and on). Narrowed to 3 and the duplicate half of 1.

**Unit 5**

- `consistency-models`: 1 linearizable vs causal vs eventual from operation sequences `T` (no history checker); 2 choose the minimum model `T`; 3 quorum R and W over N `M` in a failure-free model: stale reads appear when R + W ≤ N (master plan R3). Quorum overlap does not give linearizability with sloppy quorums or concurrent writes, so the debrief must say that; S-086 checks it. A "success" at R + W > N must not be read as "consistent". Narrowed to the quorum latency and staleness trade-off.
- `locks-leases-fencing`: `T` for all three (clocks, a paused process, fencing tokens are not a queueing behavior; master plan R5). **Drop `lab`.**
- `distributed-transactions`: `T` for all three (two-phase commit, saga; no isolation or coordinator model). **Drop `lab`.**

**Unit 6**

- `timeouts`: 1 choose a timeout from the dependency's latency distribution `M` (latency counts timed-out requests at their deadline, so a short timeout cannot hide slow requests); 2 calls without a timeout exhaust threads and spread failure `M` (`api-server` threads, `slow-dependency`); 3 deadline propagation between services `T`, and the model has the opposite default: a callee does not know its caller gave up (spike D, to be stated in `docs/model/api-server.md`; gap G6). Narrowed to 1 and 2.
- `retry-backoff-jitter`: 1 design a retry policy: maximum, exponential backoff with jitter `M` (relative ordering of strategies, master plan R3); 2 which errors and operations may be retried `T`/`?` (only an error rate exists, no error classes); 3 retry storm and layered retries multiply load `M` (`amplification`). Narrowed to 1 and 3.
- `circuit-breaker`: 1 the three states and transitions `M` (breaker policy; the state may be shown in the UI); 2 threshold and fallback behavior `M` for the threshold, `T` for the fallback (no fallback response in the catalog, gap G9). Narrowed to threshold and states.
- `load-shedding`: 1 shedding vs rate limiting `M` (a concurrency limit and a queue bound, goodput vs throughput); 2 which requests to reject first by priority `T` (no priority classes, gap G5); 3 degradation mode and its trigger `T` (gap G5). Narrowed to objective 1.
- `cascading-failure`: 1 trace one overloaded component causing others to fail `M` (pool and thread exhaustion upstream); 2 choose a step to break the chain: bulkhead, concurrency limit, more capacity `?` (concurrency limit and capacity exist; a bulkhead depends on S-083, gap G11); 3 why adding servers during overload can make it worse `?` (it does only through effects the model has, such as retries or a shared dependency; do not teach it without a V4 test that shows it). Narrowed to 1 and the steps the catalog has.

## 5. Order of work, and what each unit needs

The order after the early-access labs follows the master plan (M4: units 1, 2, 6, 3, 4, 5) and the S-08x tickets in `docs/PLAN.md` 8.6.

| Ticket | Unit | Labs | Engine work beyond the slice |
| --- | --- | --- | --- |
| BG1 (S-070) | 2 | `caching-basics` | S-024, S-030a |
| BG2 (S-080) | 0 | `single-machine-limits` (+ `connection-pooling`) | S-030a (`traffic-spike`) |
| S-081 | 1 | `latency-throughput` (+ `littles-law`) | none: slice components and `traffic-spike` |
| S-082 | 2 | `load-balancer-reverse-proxy`, `idempotency`, `rate-limiting` | S-026, S-028, S-023b, S-030b |
| S-083 | 6 | `timeouts`, `retry-backoff-jitter`, `circuit-breaker`, `load-shedding`, `cascading-failure` | S-023b, S-028, S-029, S-030b, S-041 |
| S-084 | 3 | `replication`, `partitioning-sharding` | S-025c, S-031, S-030b |
| S-085 | 4 | `message-queue` (+ `backpressure-consumer-lag`), `delivery-semantics` | S-016, S-027 |
| S-086 | 5 | `consistency-models` | S-031 |

Cheapest to start: S-081 (nothing new in the engine). The Unit 6 group is the largest (five labs), and four of the five depend on S-023b and S-030b. If the list must shrink, the thinnest labs are `rate-limiting` (1 of 4 objectives), `load-shedding` (1 of 3) and `consistency-models` (1 of 3); that is a suggestion for the owner, not a decision.

## 6. Catalog gaps found by this matrix

The matrix needs these details and the plan does not fix them. Each is an open question for the ticket that owns the component, not a decision here. Until a gap is closed, the objective stays `T` in the lab spec.

| Gap | Needed by | Question | Ticket |
| --- | --- | --- | --- |
| G1 | `message-queue` 3, `delivery-semantics` 1 | A worker that fails or never acknowledges a message (failure probability, poison messages); acknowledge-before-process for at-most-once loss | S-027 |
| G2 | `partitioning-sharding` 2 | Options of the key-to-partition map (`hash`, `range`). Range partitioning shows a hot spot only if hot keys are adjacent in key order: an assumption that needs an assumption id and probably an `illustrative` label for that part | S-031 |
| G3 | `replication-lag-failover` 1 and 2 | Read routing after a write, and binding a user to one replica | none planned |
| G4 | `load-balancer-reverse-proxy` 3 | A load balancer that can itself fail (`no-spof` is an `sdlab` structural predicate, but the catalog does not say what a failing load balancer does) | S-026 |
| G5 | `load-shedding` 2 and 3 | Request priority classes; degradation modes | none planned |
| G6 | `timeouts` 3 | Deadline propagation. Default model: no propagation | S-022, S-023b |
| G7 | `rate-limiting` 1, 3, 4 | Fixed and sliding window; a counter shared across instances; 429 semantics | S-028 |
| G8 | second caching lab | Cache write path (ADR 0003 #4) | S-024, S-025c |
| G9 | `circuit-breaker` 2 | A fallback response when the breaker is open | S-029 |
| G10 | `connection-pooling` 1 | A connection-setup cost per request in the `db` descriptor | S-025a |
| G11 | `cascading-failure` 2 | Bulkheads: separate pools per downstream, expressible with the current nodes or not | S-022, S-083 |
| G12 | `load-balancer-reverse-proxy` 2 | `hash` as a balancing policy; "least connections" is `least-outstanding` | S-026 |

## 7. Proposed text for `sdlab`

A proposal; it goes to `sdlab` as a ticket made by an `sdlab` session (`docs/PLAN.md` 10.4), after the owner decides OD-4.

> **Lab list for v1 (from `sdsim` S-011, approved by the owner on <date>).**
>
> 1. In `curriculum/concepts.yaml`, remove `lab` from `formats` of: `indexes-query-basics`, `replication-lag-failover`, `isolation-levels`, `locks-leases-fencing`, `distributed-transactions`, `capacity-headroom`. These concepts keep lesson and quiz. Reason: the simulator does not model the behavior (`not-modeled`), or the lab is deferred. Their lab objectives are practiced in the quiz.
> 2. Keep `lab` on the 16 concepts below, and write labs only for the objectives listed as practiced. Where the matrix marks an objective `T`, do not write a lab target for it; teach it in the lesson, quiz or debrief.
> 3. One spec covers several concepts through `secondary_concepts`: `single-machine-limits` (secondary `connection-pooling`), `latency-throughput` (secondary `littles-law`), `message-queue` (secondary `backpressure-consumer-lag`).
> 4. Do not list a concept in `secondary_concepts` for an objective the lab does not practice.
> 5. The labs for `consistency-models`, `partitioning-sharding` and `cascading-failure` carry a debrief line that states the limit of the model (failure-free quorum; qualitative partition behavior; no claim that more servers worsen overload unless the simulator shows it).
> 6. Lab ids use the real concept ids; the master plan's provisional ids (`limits-of-one-machine`, `percentiles`, `partitioning`, `backpressure`, `cascading-metastable-failure`) are not used.
> 7. Open for later: a second caching lab (staleness, write path) and `percentiles-tail-latency` as a 17th lab, if the owner asks.

Per lab, the scope sentence `sdlab` should respect is the "Narrowed to" clause of section 4.

## 8. Decisions for the owner (OD-4)

1. **Approve the 16-lab list** (section 1): 16 owners, 3 merges, 5 drops, 1 defer?
2. **`rate-limiting`**: keep as a small narrowed lab (recommended), or fold its token-bucket target into `load-shedding` and drop its `lab`?
3. **`timeouts` and `retry-backoff-jitter`**: two labs (recommended; the master plan has one), or one?
4. **`percentiles-tail-latency`**: add it as the 17th lab, or leave it quiz-only (recommended: leave, unless the tail-at-scale story is wanted early)?
5. **`consistency-models`**: keep the narrowed quorum lab, or drop `lab` as quiz-only (recommended: keep; the debrief carries the failure-free limit)?
6. **`capacity-headroom`**: defer as proposed, or keep `lab`?

## 9. What this matrix does not establish

- It is built from planned components, not tested ones. Every `modeled` here depends on the evidence test named in `docs/PLAN.md` and the master plan R3; a failed test changes a row.
- The objective counts are my reading of the Indonesian objective text against the component table. The `sdlab` authors may split an objective differently.
- The master plan says "modeled (qualitative docs only)" for hot partitions and "modeled after spike B" for metastable behavior; both labels are the master plan's, not verified here.
- No `sdlab` file was changed, and no ticket was created for the gaps in section 6: each belongs to a planned ticket and waits on OD-4.
