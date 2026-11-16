# ADR 0003 — The simulator is a reusable library, proven on four dissimilar scenarios

- **Status:** accepted
- **Date:** 2026-11-16
- **Decided by:** the owner, in an architecture session in chat (ticket S-014). Each decision below was asked as one question with a recommendation; the owner approved it, except where noted.

## Context

`docs/PLAN.md` (draft, 2026-11-16) plans the simulator as the engine behind the v1 labs. The owner added a direction the plan did not have:

- The simulator is a **library** reused for every later lab, not an engine shaped around one lab.
- Reusability is proven first for caching (cache, key popularity, TTL, eviction), then the caching lab is built on it.
- The owner wants to build **sandboxes** for cases outside the curriculum with the same library: a developer tool, not a learner canvas.
- The delivery priority is unchanged: the caching lab and the Unit 0 lab run for early access first.

Only one real lab spec exists (`sdlab` `content/concepts/caching-basics/lab.yaml`); the Unit 0 spec is not written yet. An API derived from one spec is a guess, so generality is checked against scenarios chosen to break the obvious assumptions (decision 5).

## Decisions

### Library architecture

1. **Component-first.** A component is a module that exports a descriptor (type, parameters with type, unit, range and default, emitted metrics, honesty label with evidence ids) and its behavior. The engine knows only a registry. `contract/catalog.json` for labs is **generated** from a curated list of components and committed, so PRs show its diff. Components registered outside that list (sandbox) are labelled `unverified`; they reach the lab catalog only by promotion: moved into the curated list, given evidence tests, reviewed by `model-reviewer`, released as a contract minor. *Reason:* one source of truth for parameters and ranges, and the only shape in which a component can be added from outside the packages. *Rejected:* a hand-written `catalog.yaml` as authority (PLAN's original), which leaves sandbox components nowhere to live.
2. **Components are written as generator processes** (SimPy style: hold a resource, delay, call, release, read top to bottom). The kernel itself (heap, clock, RNG streams) stays callback-based. *Reason:* readable flows reduce agent-written model bugs (risk K1+K9) and make sandbox components cheap to write. *Risk:* generator overhead in JS is unmeasured; spike A (S-003) measures the generator path against the budgets in PLAN 9.4. *Fallback:* the hottest components are rewritten as state machines behind the same descriptor, so the contract, labs and sandboxes do not change.
3. **Key popularity belongs to the workload.** `keys` and `skew` move from the `cache` node to `traffic`; every request carries a key drawn from a seeded Zipf stream; cache, database partitions and the `hot-key` scenario read it. `cache.capacity_pct` stays on the cache, as a percentage of `traffic.keys`. Eviction is LRU only, with no eviction-strategy interface until a lab needs another policy. *Reason:* two cache tiers, partitions, hot keys and a write path all need the same key; moving it now costs one spec edit, after contract v0.1.0 it is a breaking change. *Consequence:* an `sdlab` ticket changes `caching-basics/lab.yaml` and content-schema §5.
4. **Requests move by three moves plus topology.** The kernel offers `reply` (answer the sender: success, error or rejection), `call` (forward downstream and wait, keeping held resources) and `handoff` (answer now, continue without the sender waiting). Topology says who a node's neighbors are; a node's behavior says what it does with them. The standard `api-server` calls its downstream nodes in edge order until one answers, so look-aside, read-through and two-tier caches come from edges, not code. *Rejected for now:* an explicit `route:` field in lab specs; it can be added on top later without kernel changes. *Left open:* cache write-path semantics (invalidate or wait for TTL), decided when the staleness lab spec is written.

### Proof of reuse

5. **Reuse gate G1-G4.** The library counts as reusable when four scenarios run on the same engine, deterministically (same seed, same hash), with **no kernel change between G1 and G4**:

   | Gate | Scenario | Assumption it tests |
   | --- | --- | --- |
   | G1 | Caching lab: client → app → cache → db | requests carry keys; a node can answer early |
   | G2 | Unit 0 lab: client → app(threads) → db(pool) | resources stay held while waiting downstream; checked against M/M/c oracles |
   | G3 | Async queue: producer → queue → worker pool (unbounded queue, no DLQ or visibility timeout) | work without a reply; breaks "everything is request/response" |
   | G4 | A token-bucket rate limiter written in `sandbox/`, used with the standard `api-server` | the registry and SPI work without touching the packages (zero diff in `packages/engine` and `packages/components`) |

   Early access needs only G1 and G2. G3 and G4 do not block it; they must pass before the contract freezes at 1.0.0 and before a third lab is built.
6. **Rules against speculative abstraction.** Every public API has a user among G1-G4; the public API is listed in one file (`docs/api.md`) and every change to it is reviewed; the kernel is written last and smallest, offering only what the G1/G2 components call.

### Sandbox and distribution

7. **Sandbox = CLI plus a static HTML report first.** A sandbox scenario file is a lab spec without the teaching fields (`topology`, `traffic`, `scenarios`, duration; no targets, hints or debrief), so there is one format and one validator, and a good sandbox can be promoted to a lab. `sdsim run <folder> --seeds N` writes metrics per node, time-series charts, the determinism hash and the honesty label per node. A local dev page (`sdsim dev`) that reuses the lab UI without grading follows after the lab UI exists. No public sandbox page in v1 (D2). The sandbox is never on the early-access critical path.
8. **Sandbox lives in `sandbox/` inside this repo** and imports only the packages' public entry points, enforced by `exports` in each `package.json` and a lint boundary; G4 fails if it needs an internal import. `sdlab` keeps receiving the contract and CLI as GitHub Release tarballs (PLAN 5.4), unchanged. Publishing to npm is deferred until after contract 1.0.0 and needs the owner's explicit go-ahead (AGENTS.md rule 9).

### Plan

9. **The owner writes the Unit 0 lab spec in `sdlab` first**; the SPI is locked only after that spec exists. Caching work in `sdsim` does not wait for it. *Note:* the agent recommended a draft fixture in `sdsim` in parallel; the owner chose to write the real spec first.
10. **Contract and public API freeze at 1.0.0 after BG2 + G3 + G4** (replaces PLAN P-2/R9 "after BG2"). Early access runs on 0.x, where minors may break; that is cheap while the owner is the only tester (sdlab ADR 0007).
11. **OD-5 decided as recommended:** one Unit 0 lab owned by `single-machine-limits`, secondary `connection-pooling`; threads and pool only, all `modeled`; CPU, memory and disk stay in lesson and quiz; `indexes-query-basics` has no lab. The illustrative pool-contention curve (A-M4, S-025b) is **not** in early access; it may come later as a 0.x minor.
12. **OD-1 decided:** `Alfthrpy/sdsim`, public, MIT for code. Creating the remote is S-009.
13. **OD-9 decided:** two tracks; workload is irregular because this is a side project. The plan counts sessions, not dates; the two tracks are kept independent except at named meeting points (I0, BG1, BG2); PRs are stacked at most one level deep.
14. **OD-2, OD-3, OD-6, OD-10 decided as recommended:** GitHub Pages (Render static as fallback); the quiz and lesson app lives in `sdsim/apps/web`; D8 (seeded determinism) and D11 (rule-based grading, no LLM) confirmed; lesson pages are in the beta and first to cut. **OD-7 and OD-8 stay for SG0**; spike D is narrowed to "borrow ideas, not code", since decisions 1, 2 and 4 make adopting Breakscale or loadsketch unlikely.

## Consequences

- PLAN.md is revised in the same ticket (S-014): S-010 splits into schema/descriptor format (S-010) and the generated catalog plus first contract release (S-010b); new tickets S-015 (process runtime and public API doc), S-016 (G3 queue and worker, minimal), S-017 (sandbox CLI and HTML report), S-018 (G4 external rate limiter), S-019 (sandbox dev page); contract 1.0.0 (S-072) depends on G3 and G4.
- The early-access path grows by about one session (the S-010 split and the process runtime); G3, G4 and the sandbox add about four to five sessions after it. These are estimates, not measured.
- The order of labs is caching first (BG1), then Unit 0 (BG2). This differs from sdlab ADR 0007 point 3 ("Unit 0 first") for the simulator only: Unit 0 *content* still ships first in sdlab; the caching lab runs first because its spec exists and it exercises more of the library.
- `sdlab` follow-ups (proposed, not done here): move `keys`/`skew` to `traffic` in `caching-basics/lab.yaml` and content-schema §5; write the Unit 0 lab spec under the OD-5 scope; edit `concepts.yaml` formats for `indexes-query-basics`.
- The master plan (Claude Docs) is not edited; PLAN.md section 4 records the differences.
