# Lab matrix (S-011)

Input to **OD-4** (the v1 lab list). The owner decides; nothing here changes `sdlab` by itself. A lab is valid only in the intersection of what `sdlab` wants taught and what the catalog can simulate honestly (master plan 5.1).

- **Read on 2026-11-19:** `sdlab` `curriculum/concepts.yaml` at commit `55a509d` (50 concepts); the STUD Simulator Master Plan (Claude Docs, rev 97): component table 4.3, scenarios 4.4, metrics 4.5, grounding table R3, lab table R5; this repo's `docs/PLAN.md` and ADR 0003. Metric ids, master-plan lab ids (L01 to L16) and the master-plan labels quoted below were read from those tables by the author; the independent reviewer could not open the master plan and checked only against this repo and `sdlab`.
- **Count:** 25 concepts list `lab` in `formats` (`docs/HANDOFF.md` says 24; the file says 25). All 25 have status `planned`.
- **What "planned label" means.** Only the single-station queueing kernel exists today (S-003: M/M/1, M/M/c and Little's-law oracles). No component exists yet. A label below is the one the catalog will carry **if its evidence test passes**, not a claim that it is earned. Section 2.1 names the check behind each label, or says there is none yet.
- **Objective codes.** `M` the objective can be practiced in the planned catalog. `I` only through an illustrative behavior. `T` text, quiz or debrief only: the simulator cannot show it. `?` depends on a catalog detail the plan does not fix (section 6). In the matrix, **Obj.** is the number of objectives with at least a modeled part, over the concept's objectives; section 4 says which of them are only partly practiced.

## 1. Recommendation at a glance

**Proposed v1 list: 15 labs** (the master plan's target was 16). Of the 25 concepts that list `lab`: 15 own a lab, 4 become secondary concepts of another lab, 5 lose `lab` (not modelable), 1 is deferred.

**Rule used** (not the count target): (1) drop `lab` when no objective can be practiced; (2) merge into another lab when the concept's practiced objectives use that lab's topology and metrics; (3) defer when it is modelable but repeats the mechanics of another lab; (4) otherwise keep. A kept lab that practices at most a third of its objectives is marked **thin** and appears in the owner's questions (section 8).

| Recommendation | Concepts | `sdlab` edit |
| --- | --- | --- |
| **Keep** (15 own a lab) | `single-machine-limits`, `latency-throughput`, `load-balancer-reverse-proxy`, `caching-basics`, `idempotency`, `replication`, `partitioning-sharding`, `message-queue`, `delivery-semantics`, `consistency-models` (thin), `timeouts`, `retry-backoff-jitter`, `circuit-breaker`, `load-shedding` (thin), `cascading-failure` | none (each lab states which objectives it practices, section 4) |
| **Merge** (secondary concept of another lab) | `connection-pooling` into `single-machine-limits` (OD-5, already decided), `littles-law` into `latency-throughput`, `backpressure-consumer-lag` into `message-queue`, `rate-limiting` into `load-shedding` | none: `scripts/validate.py` in `sdlab` counts a concept named in `secondary_concepts` as having its lab, so `formats` stays |
| **Drop `lab`** (default of OD-4: not modelable) | `indexes-query-basics` (also OD-5), `replication-lag-failover`, `isolation-levels`, `locks-leases-fencing`, `distributed-transactions` | remove `lab` from `formats` |
| **Defer** (modelable, but repeats another lab) | `capacity-headroom` | remove `lab` now (else `validate.py` fails the concept once it reaches `review`); add it back when a lab is scheduled |
| **Candidates** (no `lab` today) | `percentiles-tail-latency` (modelable; a 16th lab if the owner wants it), `metastable-failure` (after S-041), a second caching lab (staleness), `cdn` and `cache-stampede-hot-keys` (no) | owner's call, section 3 |

Differences from the master plan's 16 (L01 to L16): L03 (`percentiles`) and L06 (`cdn`) are not in `sdlab`'s `lab` list and are not in this list; `retry-backoff-jitter` gets its own lab because `sdlab` lists `lab` for both it and `timeouts` and their objectives differ; `rate-limiting` is folded into L15 as the master plan already had it (token bucket inside load shedding); L16 is `cascading-failure` only.

## 2. The matrix (25 concepts that list `lab`)

"Tickets" are the engine tickets in `docs/PLAN.md` section 8 that the lab needs beyond the vertical slice (S-021, S-022, S-023a, S-025a). A ticket in brackets names the evidence check, not a build dependency.

| Unit | Concept | MP id | Obj. | Planned label | Components, policies, scenarios | Tickets | Role | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `indexes-query-basics` | none (R5: quiz-only) | 0/3 | `not-modeled` | would need a query-cost model | none | none | **Drop `lab`** |
| 0 | `connection-pooling` | L01 | 2/3 | modeled; pool contention illustrative (A-M4) | `client`, `api-server`, `db` pool; `traffic-spike` | S-030a | secondary of `single-machine-limits` | **Merge** |
| 0 | `single-machine-limits` | L01 | 2/3 | modeled (threads, pool) | same as above | S-030a | owner | **Keep** (OD-5; the owner writes the spec) |
| 1 | `latency-throughput` | L02 | 2/2 | modeled | `client`, `api-server`; `traffic-spike`; `in_flight`, `utilization`, latency percentiles | S-030a | owner | **Keep** |
| 1 | `littles-law` | L02 | 2/2 | modeled | same lab; metric `in_flight` | S-030a | secondary of `latency-throughput` | **Merge** |
| 1 | `capacity-headroom` | none | 2/2 | modeled | same components; `traffic-spike` | S-030a | none | **Defer** |
| 2 | `load-balancer-reverse-proxy` | L04 | 2/3 | modeled | `load-balancer` (round-robin, random, least-outstanding; health checks), `api-server` x n; `instance-crash` | S-026, S-030b | owner | **Keep**, narrowed |
| 2 | `caching-basics` | L05 | 2/3 | modeled | `cache`, `db`; `cache-flush` | S-024, S-030a (BG1) | owner | **Keep** (spec exists) |
| 2 | `idempotency` | L07 | 2/3 | modeled | `client` retries + `idempotency-key`, `db`; `slow-dependency`; `duplicate_effects` | S-023b, S-030b | owner | **Keep**, narrowed |
| 2 | `rate-limiting` | none (in L15) | 0/4 | modeled (token bucket) | `rate-limiter` (rate, burst); `traffic-spike`; `shed_rate` | S-028 | secondary of `load-shedding` | **Merge** |
| 3 | `replication` | L08 | 2/3 | modeled | `db` replicas 0 to 3, apply stream, quorum with W = N for sync; `write-burst`; `replica_lag`, `stale_read_ratio` | S-025c, S-031, S-030b | owner | **Keep**, narrowed |
| 3 | `replication-lag-failover` | none (R3: failover not in v1) | 1/3 | symptom `modeled`, mitigation and failover `not-modeled` | would need read routing and failover | none | none | **Drop `lab`** |
| 3 | `partitioning-sharding` | L09 | 2/3 | modeled (qualitative ground truth only) | `db` partitions 1 to 8, key map; `hot-key`; per-partition `utilization` | S-031 | owner | **Keep**, narrowed |
| 3 | `isolation-levels` | none (R5: quiz-only) | 0/2 | `not-modeled` | anomalies are not a queueing behavior | none | none | **Drop `lab`** |
| 4 | `message-queue` | L10 | 2/3 | modeled | `queue`, `worker`; `traffic-spike`; `queue_length`, `queue_age` | S-016, S-027, S-030a | owner | **Keep**, narrowed |
| 4 | `delivery-semantics` | L11 | 2/3 | modeled for duplicates; the idempotent-worker switch illustrative | `queue` (visibility timeout), `worker` (idempotent flag); `duplicate_effects` | S-016, S-027 | owner | **Keep**, narrowed |
| 4 | `backpressure-consumer-lag` | L10 | 2/3 | modeled | same lab as `message-queue` | S-016, S-027 | secondary of `message-queue` | **Merge** |
| 5 | `consistency-models` | L12 | 1/3 | modeled, failure-free | `db` quorum (N, R, W); `write-burst`; `stale_read_ratio` | S-031, S-030b | owner | **Keep**, narrowed, thin (Unit 5: "only where honest") |
| 5 | `locks-leases-fencing` | none (R5) | 0/3 | `not-modeled` | clocks, pauses, fencing tokens | none | none | **Drop `lab`** |
| 5 | `distributed-transactions` | none (R5) | 0/3 | `not-modeled` | two-phase commit, sagas | none | none | **Drop `lab`** |
| 6 | `timeouts` | L13 | 2/3 | modeled | `client` timeout and retries, `api-server` threads, `external-dependency`; `slow-dependency`, `dependency-errors` | S-023b, S-028, S-030b | owner | **Keep**, narrowed |
| 6 | `retry-backoff-jitter` | L13 | 2/3 | modeled | `client` retries, backoff, jitter, budget, `external-dependency`; `dependency-errors`; `amplification` | S-023b, S-028, S-030b [S-042] | owner | **Keep**, narrowed |
| 6 | `circuit-breaker` | L14 | 1/2 | modeled | breaker policy, `external-dependency`; `slow-dependency`; `breaker_open_time` | S-029, S-028, S-030b | owner | **Keep**, narrowed |
| 6 | `load-shedding` | L15 | 1/3 | modeled | `api-server` concurrency limit and queue bound, `rate-limiter`; `traffic-spike`; `goodput_rps`, `shed_rate` | S-028, S-030a | owner | **Keep**, narrowed, thin |
| 6 | `cascading-failure` | L16 | 1/3 | **conditional**: modeled only if V4(a) passes (S-041); otherwise illustrative | `api-server` pools, `external-dependency`; `slow-dependency`, `traffic-spike`; `amplification` | S-023b, S-028, S-030b [S-041] | owner | **Keep**, narrowed |

### 2.1 Evidence behind each planned label

From `docs/PLAN.md` section 8 and master plan R3. "No named check yet" means the plan has no V-check for that behavior, so the label cannot be claimed until one is added.

| Behavior (labs) | Check named in the plan | State |
| --- | --- | --- |
| Station, saturation knee, `in_flight` (`single-machine-limits`, `latency-throughput`, `littles-law`, `capacity-headroom`) | V1 oracles, S-022; the kernel oracles exist (S-003) | station only; no component yet |
| Pool contention (`connection-pooling`) | none: A-M4 is illustrative, S-025b not in early access | `illustrative` |
| Cache hit ratio, cold start (`caching-basics`) | V4(d), S-024 | planned |
| Load balancer policies, detection window (`load-balancer-reverse-proxy`) | V10 detection window, S-026 | planned |
| Commit-then-timeout duplicates (`idempotency`) | V4(c), S-023b | planned; idempotency-key dedupe: no named check yet |
| Replica lag and stale reads (`replication`) | V10 lag, S-025c | planned |
| Hot partition (`partitioning-sharding`) | V10 hot-key, S-031; ground truth is documentation only (master plan R3: "qualitative docs only") | planned, weakest `modeled` in the list |
| Quorum latency and staleness (`consistency-models`) | V10 quorum latency and staleness, S-031 | planned, failure-free only |
| Worker pool as M/M/c (`message-queue`) | V1-style oracle in S-016 | planned; bounded queue, queue age and drain time: no named check yet |
| At-least-once duplicates (`delivery-semantics`) | V10 duplicates, S-027 | planned; the idempotent-worker flag removes duplicates by definition, so it is `illustrative` |
| Retry strategies, retry amplification (`retry-backoff-jitter`) | V4(b), S-042 (Brooker 2022; AWS backoff and jitter) | planned |
| Timeouts, thread exhaustion by a slow dependency (`timeouts`) | none | no named check yet |
| Circuit breaker states and threshold (`circuit-breaker`) | S-042 covers the retry-breaker shape (Brooker 2022); nothing covers the three states | no named check yet for the states |
| Concurrency limit, goodput vs throughput (`load-shedding`) | V10 token bucket, S-028, for the token bucket only | goodput curve: no named check yet |
| Cascading failure, metastable loop (`cascading-failure`) | V4(a), S-041 (HotOS '25 reproduction, decides the L16 label) | conditional on S-041 |

## 3. Candidates that do not list `lab`

| Concept | Verdict | Reason |
| --- | --- | --- |
| `percentiles-tail-latency` (master plan L03) | **Modelable; owner's call.** Would be a 16th lab | Objectives 2 and 3 are practicable: the mean hides slow requests, and the chance that a user meets a slow request grows with fan-out (`api-server` fan-out k, wait for all or first r; ground truth: tail-at-scale, master plan R3, planned `modeled`; no V-check is named for it in the plan). Objective 1 (compute p50, p95, p99 from data) is text. Needs S-022 only. `sdlab` left `lab` off at G1 |
| `metastable-failure` (part of L16) | **Not yet.** Revisit after S-041 | The master plan label is "modeled after spike B": `modeled` only if V4(a) passes. If it passes, a lab can be a second lab of `cascading-failure`; if not, it stays `illustrative` or text. Do not write the spec before then |
| Second caching lab: staleness and write path | **Later, blocked by a design choice** | `caching-basics` objective 1 (cache-aside vs write-through) and the staleness side of objective 2 need a write path and `stale_read_ratio`. ADR 0003 #4 leaves the cache write path open, and R22 names S-025c. Decide the write path when this lab is specified |
| `cdn` (master plan L06) | **No lab** | Objectives are about content types and `Cache-Control` / `ETag` headers (text). The one simulable part, an RTT saving at the edge, repeats the cache mechanism of `caching-basics` with an illustrative constant |
| `cache-stampede-hot-keys` | **No lab** | The simulator has coalescing and `cache-flush`, but not TTL jitter, background refresh or a multi-node cache, so two of its three objectives are text. An incident (GCP Service Control involves a herd) serves it better than a tune lab |

## 4. Per concept: what the lab can and cannot practice

Objectives are paraphrased from `concepts.yaml` (Indonesian in the source). "Narrowed to" says what the lab spec may target; everything marked `T` stays in the lesson, quiz and debrief, and the lab must not imply it was simulated.

**Unit 0**

- `indexes-query-basics`: 1 read `EXPLAIN` `T`; 2 choose an index column `T`; 3 index cost on writes `T`. No query-cost model exists (master plan R5, OD-5). **Drop `lab`.**
- `connection-pooling`: 1 why a new connection per request is wasteful `?` (no connection-setup cost in the `db` descriptor, G10); 2 size a pool from cores, query load and the database limit, then validate: partly `M` (pool and queue), `T` for cores (no CPU model); "more connections are not faster" is illustrative (A-M4, S-025b, not in early access); 3 diagnose pool exhaustion `M` (queue wait for a connection, `utilization`, `queue_age`). **Merge** into the Unit 0 lab (OD-5).
- `single-machine-limits`: 1 tell which of CPU, memory, disk, connections is the bottleneck `T`: only threads and connections exist, so the answer would always be "connections", and the lab must not ask learners to choose among the four; 2 USE method on one resource `M` (utilization, saturation as queue wait, errors); 3 is vertical scaling enough? partly `M` (threads and instances; no price or largest-machine ceiling in the catalog). The spec and debrief state that CPU, memory and disk are not simulated (OD-5).

**Unit 1**

- `latency-throughput`: 1 latency vs throughput `M`; 2 latency rises sharply near full utilization `M` (the M/M/c oracle, the one behavior with a test today). One lab, owner of L02.
- `littles-law`: 1 use L = λW `M` (`in_flight`); 2 size a thread pool or queue from target throughput and latency `M`. Shares the L02 lab as a second target.
- `capacity-headroom`: 1 headroom from a measured peak and measured capacity `M`; 2 decide from numbers whether one server still suffices `M`. Modelable and cheap, but it repeats L01 and L02 mechanics. **Defer.**

**Unit 2**

- `load-balancer-reverse-proxy`: 1 one address serving many instances, TLS termination, routing, buffering `T`; 2 choose round-robin, least connections, or hash: partly `M` (round-robin, random, least-outstanding; no `hash`, G12). With identical instances and the same service-time distribution the three policies may differ little, so the lab needs a slow instance or uneven request cost (G15); 3 health checks `M` (the error window equals the detection delay, V10); the load balancer as a single point of failure `?` (G4). Narrowed to policy choice under a slow or crashed instance, and health-check timing.
- `caching-basics`: spec exists. Objective 3 `M` (hit ratio against database load). Objective 2 only on its load side: TTL and capacity against database load; the "tolerance for stale data" side `T`. The `sdlab` spec header says it practices objectives 2 and 3, which overstates objective 2 until the second lab. Objective 1 `T`.
- `idempotency`: 1 which operations are idempotent, HTTP methods `T`; 2 design an idempotency key: key on or off only (`I`/`T`); 3 retry without a key duplicates the effect `M` (`duplicate_effects`, commit-then-timeout duplicates, V4(c)). Narrowed to objective 3 and key on/off.
- `rate-limiting`: 1 compare token bucket, fixed window, sliding window `T` (only a token bucket exists, so there is nothing to compare, G7); 2 where the limit sits and the key `?` (per client needs a client identity the catalog does not give, G13); 3 shared counters across instances `T` (G7); 4 429 and `Retry-After` `T`. Rate and burst of one token bucket can be tuned, but that is a parameter, not one of the objectives. **Merge** into `load-shedding` as a token-bucket target; the objectives above stay in lesson and quiz.

**Unit 3**

- `replication`: 1 leader and followers, sync or async `M` (async, or quorum with W = N); 2 when a read replica is enough to cut read load `M`; 3 what happens to unreplicated writes when the leader dies `T` (failover is not in the v1 catalog, master plan R3). Narrowed to objectives 1 and 2.
- `replication-lag-failover`: 1 read-your-writes failures and mitigation `?` (G3); 2 monotonic reads and mitigation `?` (G3); 3 manual failover, split brain, fencing `T`. `replica_lag` and `stale_read_ratio` show the symptom, but the mitigations need read routing the catalog does not have. The symptom is already shown in the `replication` lab. **Drop `lab`.**
- `partitioning-sharding`: 1 choose a key, hot partition risk `M` (qualitative, `hot-key`); 2 range vs hash `?` (the key-to-partition map has no stated options, G2); 3 cost of sharding, cross-shard queries, rebalancing `T`. Narrowed to 1, and 2 only if S-031 adds the map options.
- `isolation-levels`: 1 recognize anomalies `T`; 2 choose a level or lock `T`. **Drop `lab`.**

**Unit 4**

- `message-queue`: 1 which work to move off the request path `M` in outline (a producer gets a `handoff` reply, so the request path shortens); 2 visibility timeout, acknowledgement, competing consumers `M`; 3 dead-letter queue for repeatedly failing messages `?` (S-027 plans max receives and a DLQ, but nothing makes a message fail, G1). Narrowed to 1 and 2.
- `backpressure-consumer-lag`: 1 diagnose a growing queue from `queue_age` and lag `M`; 2 add consumers or limit the producer `M` (consumers 1 to 50; the producer rate is a client edit); 3 backpressure vs load shedding `T` (the debrief; shedding is practiced in `load-shedding`). Merged: the same topology and metrics as `message-queue`.
- `delivery-semantics`: 1 three semantics, when messages are lost or duplicated: `M` for at-least-once duplicates (visibility timeout against processing time), `T` for at-most-once loss (no acknowledge-before-process or worker crash, G1); 2 design an idempotent consumer `I`/`T` (a flag on or off); 3 exactly-once is at-least-once plus idempotent processing: the worker flag removes duplicate effects by definition, so this is shown, not derived, and is `illustrative`. The debrief says the flag is a switch, and the boundary clause (external side effects still need idempotency) stays text. Narrowed to the duplicate half of 1 and the flag comparison in 3.

**Unit 5**

- `consistency-models`: 1 linearizable vs causal vs eventual from operation sequences `T` (no history checker); 2 choose the minimum model `T`; 3 quorum R and W over N `M` in a failure-free model: stale reads appear when R + W ≤ N (master plan R3). Quorum overlap does not give linearizability with sloppy quorums or concurrent writes, so the debrief must say that, and S-086 checks it; a pass at R + W > N must not be read as "consistent". Narrowed to the quorum latency and staleness trade-off. Thin.
- `locks-leases-fencing`: `T` for all three (clocks, a paused process, fencing tokens are not a queueing behavior; master plan R5). **Drop `lab`.**
- `distributed-transactions`: `T` for all three (two-phase commit, saga; no isolation or coordinator model). **Drop `lab`.**

**Unit 6**

- `timeouts`: 1 choose a timeout from the dependency's latency distribution `M`; 2 calls without a timeout exhaust threads and spread failure `M` (`api-server` threads, `slow-dependency`); 3 deadline propagation between services `T`, and the model's default is the opposite: a callee does not know its caller gave up (spike D, to be stated in `docs/model/api-server.md`; G6). Latency counts a timed-out request at its deadline (censored), which caps p99 at the timeout, so a short timeout would win a latency target on its own. The guard is rule C12: every timeouts and retry lab pairs a latency target with an `error_rate` or `goodput_rps` target. Narrowed to 1 and 2.
- `retry-backoff-jitter`: 1 design a retry policy: maximum, exponential backoff with jitter `M` (relative ordering of strategies, master plan R3, V4(b)); 2 which errors and operations may be retried `?` (only an error rate exists, no error classes, G14); 3 retry storm and layered retries multiply load `M` (`amplification`). Same C12 pairing as `timeouts`. Narrowed to 1 and 3.
- `circuit-breaker`: 1 the three states and transitions `M` (breaker policy; states shown in the UI); 2 threshold and fallback behavior: `M` for the threshold, `T` for the fallback (no fallback response, G9). Narrowed to threshold and states.
- `load-shedding`: 1 shedding vs rate limiting `M` (a concurrency limit and a queue bound against a token bucket; goodput vs throughput); 2 which requests to reject first by priority `T` (G5); 3 degradation mode and its trigger `T` (G5). Narrowed to objective 1 plus the token-bucket target for `rate-limiting`. Thin.
- `cascading-failure`: 1 trace one overloaded component causing others to fail `M` (pool and thread exhaustion upstream; no standalone check, and the label depends on V4(a)); 2 choose a step to break the chain: bulkhead, concurrency limit, more capacity `?` (concurrency limit and capacity exist; a bulkhead depends on S-083, G11); 3 why adding servers during overload can make it worse `T`: the model shows it only through effects it has (retries, a shared dependency), so do not teach it unless a V4 test shows it. Narrowed to 1 and the steps the catalog has.

## 5. Order of work, and what each unit needs

The order after the early-access labs follows the master plan (M4: units 1, 2, 6, 3, 4, 5) and the S-08x tickets in `docs/PLAN.md` 8.6.

| Ticket | Unit | Labs | Engine work beyond the slice |
| --- | --- | --- | --- |
| BG1 (S-070) | 2 | `caching-basics` | S-024, S-030a |
| BG2 (S-080) | 0 | `single-machine-limits` (+ `connection-pooling`) | S-030a (`traffic-spike`) |
| S-081 | 1 | `latency-throughput` (+ `littles-law`) | S-030a, already built for BG2; no new engine work |
| S-082 | 2 | `load-balancer-reverse-proxy`, `idempotency` | S-026, S-023b, S-030b |
| S-083 | 6 | `timeouts`, `retry-backoff-jitter`, `circuit-breaker`, `load-shedding` (+ `rate-limiting`), `cascading-failure` | S-023b, S-028, S-029, S-030b, S-041 |
| S-084 | 3 | `replication`, `partitioning-sharding` | S-025c, S-031, S-030b |
| S-085 | 4 | `message-queue` (+ `backpressure-consumer-lag`), `delivery-semantics` | S-016, S-027 |
| S-086 | 5 | `consistency-models` | S-031 |

Cheapest to start: S-081. The Unit 6 group is the largest (five labs), and four of the five depend on S-023b and S-030b. If the list must shrink, the thin labs (`load-shedding`, `consistency-models`) are the first to look at; that is a suggestion for the owner, not a decision.

## 6. Catalog gaps found by this matrix

The matrix needs these details and the plan does not fix them. Each is an open question for the ticket that owns the component, not a decision here. Until a gap is closed, the objective stays `T` in the lab spec. G1, G4, G5, G9, G10 and G11 depend on the master plan's component table (4.3), which the author read and the reviewer could not.

| Gap | Needed by | Question | Ticket |
| --- | --- | --- | --- |
| G1 | `message-queue` 3, `delivery-semantics` 1 | S-027 plans max receives and a DLQ; a worker that fails a message (failure probability, poison messages) is missing, and so is acknowledge-before-process for at-most-once loss | S-027 |
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
| G13 | `rate-limiting` 2 | Client identity for a per-client limit | S-023a, S-028 |
| G14 | `retry-backoff-jitter` 2 | Error classes (retryable or not); only an error rate exists | S-023b |
| G15 | `load-balancer-reverse-proxy` 2 | Heterogeneous instances or request cost, so that the policies differ | S-022, S-026 |

## 7. Proposed text for `sdlab`

A proposal; it goes to `sdlab` as a ticket made by an `sdlab` session (`docs/PLAN.md` 10.4), after the owner decides OD-4.

> **Lab list for v1 (from `sdsim` S-011, approved by the owner on <date>).**
>
> 1. In `curriculum/concepts.yaml`, remove `lab` from `formats` of: `indexes-query-basics`, `replication-lag-failover`, `isolation-levels`, `locks-leases-fencing`, `distributed-transactions`, `capacity-headroom`. These concepts keep lesson and quiz. Reason: the simulator does not model the behavior (`not-modeled`), or the lab is deferred.
> 2. Keep `lab` on the 15 owning concepts, and write one lab for each: `single-machine-limits`, `latency-throughput`, `load-balancer-reverse-proxy`, `caching-basics`, `idempotency`, `replication`, `partitioning-sharding`, `message-queue`, `delivery-semantics`, `consistency-models`, `timeouts`, `retry-backoff-jitter`, `circuit-breaker`, `load-shedding`, `cascading-failure`.
> 3. Keep `lab` on the 4 secondary concepts and cover each through `secondary_concepts` of the lab named: `connection-pooling` in `single-machine-limits`, `littles-law` in `latency-throughput`, `backpressure-consumer-lag` in `message-queue`, `rate-limiting` in `load-shedding`. Name a concept as secondary only for an objective the lab practices.
> 4. Write a lab target only for the objectives the matrix lists as practiced (section 4, "Narrowed to"). Where an objective is `T`, teach it in the lesson, quiz or debrief.
> 5. The labs for `consistency-models`, `partitioning-sharding` and `cascading-failure` carry a debrief line that states the limit of the model (failure-free quorum; qualitative partition behavior; no claim that more servers worsen overload unless the simulator shows it). The labs for `timeouts` and `retry-backoff-jitter` pair every latency target with an `error_rate` or `goodput_rps` target (C12). The `delivery-semantics` debrief says that the idempotent-worker setting is a switch.
> 6. The `caching-basics` spec header should say it practices the load side of objective 2 (TTL and capacity against database load), not tolerance for stale data.
> 7. Lab ids use the real concept ids; the master plan's provisional ids (`limits-of-one-machine`, `percentiles`, `partitioning`, `backpressure`, `cascading-metastable-failure`) are not used.
> 8. Open for later: a second caching lab (staleness, write path), `percentiles-tail-latency` as a 16th lab, and a metastable-failure lab after V4(a).

## 8. Decisions for the owner (OD-4)

1. **Approve the 15-lab list** (section 1): 15 owners, 4 merges, 5 drops, 1 defer.
2. **`rate-limiting`**: merge into `load-shedding` as a token-bucket target (recommended; with one algorithm none of its four objectives is practiced), keep a standalone Unit 2 lab (a parameter-tuning exercise only), or drop its `lab`?
3. **`timeouts` and `retry-backoff-jitter`**: two labs (recommended; the master plan has one), or one?
4. **Thin labs** (`load-shedding`, `consistency-models`): keep both, or cut one or both from the list?
5. **`percentiles-tail-latency`**: add it as a 16th lab, or leave it quiz-only (recommended: leave, unless the tail-at-scale story is wanted early)?
6. **`capacity-headroom`**: defer as proposed, or keep `lab`?

## 9. What this matrix does not establish

- It is built from planned components, not tested ones. Every `modeled` here depends on the evidence check in section 2.1; a failed check changes a row, and where no check is named the label is not claimable.
- The objective counts are my reading of the Indonesian objective text against the component table. The `sdlab` authors may split an objective differently.
- "Modeled (qualitative docs only)" for hot partitions and "modeled after spike B" for metastable behavior are the master plan's labels, not verified here.
- No `sdlab` file was changed, and no ticket was created for the gaps in section 6: each belongs to a planned ticket and waits on OD-4.
