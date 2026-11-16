# sdsim development plan

- **Status:** draft for owner approval (written 2026-11-16 by a planning agent)
- **Inputs read for this plan:** the STUD Simulator Master Plan (Claude Docs, rev 97, all sections 1-11), and in `../sdlab`: `AGENTS.md`, `docs/ROADMAP.md`, `docs/PLAN-PHASE-1.md`, `docs/workflow.md`, ADR 0004, ADR 0007 (branch `t/P1-082-adr-beta-first`), `docs/conventions/content-schema.md` sections 4-7 (branch `t/P1-033-lab-incident-spec-format`), `content/concepts/caching-basics/{lab,questions}.yaml`, `curriculum/concepts.yaml`, `curriculum/case-studies.yaml`, `backlog/tickets/P1-024`, `P1-048`. In this repo: `AGENTS.md`, `docs/HANDOFF.md`, `docs/workflow.md`, `docs/conventions/engineering.md`, `scripts/common.py`.
- **Naming:** the master plan calls this repo `stud-sim`. It is `sdsim` (ADR 0002). Read `stud-sim` as `sdsim` everywhere in the master plan.
- **References:** "MP x.y" means master plan section x.y. "D1"-"D12" are the master plan decisions (MP 1). "ADR 0007" is sdlab's. Ticket ids `S-0xx` keep the master plan's ids (MP 10.4) where they exist.

This plan is the executable version of the master plan for this repo. The master plan stays the design reference: the model semantics (MP 4.2), catalogs (MP 4.3-4.5), validator rules (MP 5.3), the grading and lab CI rules (MP 6.2-6.4) and the validation checks (MP 7.1) are normative there. This file decides order, scope, tooling and tickets. Where the two disagree, section 4 (Reconciliation) says which one wins.

---

## 1. Purpose, scope and non-goals

### 1.1 Purpose

Build the simulator (contract, engine, lab runtime, UI) that runs `sdlab` lab specs on a phone, honestly, and grows into the full v1 set of labs and incidents. First, deliver the **beta slice** the owner asked for (ADR 0007): a quiz and a lab that run end to end for him on his phone, built on the production stack.

### 1.2 Scope by stage

| Stage | In scope | Out of scope until later |
| --- | --- | --- |
| **Beta slice (BG1)** | Contract v0 that accepts the real `caching-basics` lab spec; an engine with the components that lab uses (client, api-server, cache, db) plus oracle-tested service nodes; a lab runtime that grades over K seeds; lab CI (baseline fails, reference passes, wrong answers fail); a mobile tune-mode lab page with charts, grading feedback, hints and debrief; a quiz player for the `sdlab` question types; a static deploy. | Retries, breakers, replicas, queues, partitions; diagnose and build modes; animation; compare view; incidents; sdlab CI integration; public users. |
| **Unit 0 (BG2)** | The one Unit 0 lab (D4, ADR 0007) in tune mode; contract release + pinned CLI so `sdlab` can vendor and calibrate; contract 1.0.0 freeze. | Other units. |
| **v1 (G3)** | Everything in MP 2 goals: the approved lab list (MP target 16, see OD-4), 8 incident scenarios (modeled or illustrative), validation V1-V10, SC1-SC8 (SC6 replaced, section 4). | v2 items below. |

### 1.3 Non-goals (v1, from MP 2, kept)

- A free-form canvas over the full component set (D2). Constrained build mode is the first thing cut (MP 8.3).
- Capacity planning or numbers for real products (D3). "Database" is a generic database.
- LLM grading or AI interviewers (D11). No server-side grading.
- CPU-core, memory, disk, packet or bandwidth modeling; consensus internals; clocks; isolation anomalies (quiz-only, MP R5).
- Accounts, server-side progress, streaks, spaced repetition (Phase 3). The beta keeps progress in the browser only.
- A cost model.
- **Added:** a server of any kind for the beta. Everything is a static site (D7: allowed only within the Render free plan, and not needed).

---

## 2. Decisions in force

| # | Decision | Source | Status |
| --- | --- | --- | --- |
| D1 | The simulator is concept-teaching first; incidents and interview practice are secondary formats on the same engine | MP D1 | confirmed |
| D2 | v1 modes: tune, diagnose and fix, constrained build; no free canvas | MP D2 | confirmed; beta slice is tune only |
| D3 | Right shape; units shown and labeled illustrative; grading on thresholds and relative behavior | MP D3 | confirmed |
| D4 | Labs for Units 1-6 where honest, plus one Unit 0 lab | MP D4 | confirmed; lab list open (OD-4) |
| D5 | `sdlab` agents write lab and incident specs against the catalog owned here | MP D5, ADR 0002 | confirmed |
| D6 | Usable on mobile is the only hard constraint | MP D6, ADR 0007 | confirmed |
| D7 | Simulation runs client-side; a server only within the Render free plan | MP D7, ADR 0007 | confirmed; no server planned |
| D8 | Seeded RNG and fixed-seed replay, as an engineering choice | MP D8 | assumed; confirm at SG0 (OD-6) |
| D9 | Running caching lab at G2; all v1 labs by G3 | MP D9 | **changed by ADR 0007**: G2 becomes BG1 "a running caching lab the owner tests alone"; the 5-user pilot moves before any public beta |
| D10 | Animated request flow and side-by-side compare | MP D10 | confirmed; after BG2, both on the cut list |
| D11 | Rule-based grading, no LLM | MP D11, ADR 0007 | MP says unconfirmed; ADR 0007 lists it as confirmed. Treated as confirmed; recorded at SG0 |
| D12 | Plan format: Claude Docs | MP D12 | the master plan stays in Claude Docs; agents execute from this file |
| ADR-0007.1 | Owner is the only beta tester; content not shown to others yet | sdlab ADR 0007 | confirmed |
| ADR-0007.3 | Unit 0 ships first (8 concepts, one lab) | sdlab ADR 0007 | confirmed |
| ADR-0007.4 | Next goal: a working quiz and lab; built to keep running, agile | sdlab ADR 0007 | confirmed |
| ADR-0002 | Simulator lives in `sdsim`; owns contract, engine, runtime, grading, UI | sdsim ADR 0002 | accepted |
| M1 | Next-event DES engine; queueing formulas are test oracles | MP R2 | confirmed by research; spike A validates |
| P-1 | Toolchain in section 5.3 | this plan | proposed; owner approves via S-001 (`review: human`) |
| P-2 | Freeze contract 1.0.0 after the Unit 0 lab runs, not right after the caching lab | this plan (section 4, row R9) | proposed |

### 2.1 Open decisions

"Blocks" names the first ticket that cannot finish without the decision.

| # | Decision | Recommendation | Who | Blocks |
| --- | --- | --- | --- | --- |
| OD-1 | GitHub remote for `sdsim`: owner account, visibility, code license | `Alfthrpy/sdsim`, **public**, **MIT** for code (content license stays separate, P1-003). Public makes Actions minutes free (assumed, verify) and lets `sdlab` CI download releases without a token | owner | every PR; S-001 merge |
| OD-2 | Static hosting: GitHub Pages or Render static site | **GitHub Pages** (same place as the repo, deploy from Actions, no extra account). Render static is an equal fallback | owner | S-060 (deploy) |
| OD-3 | Where the beta learner app (lesson/quiz pages) lives | **In `sdsim/apps/web` for the beta**, reading a pinned `sdlab` content bundle at build time. A separate app repo only if Phase 3 grows (accounts, progress sync) | owner | S-100 |
| OD-4 | The v1 lab list. `concepts.yaml` (G1-approved) lists `lab` for 25 concepts; the MP R5 matrix has 16 labs, and at least 4 of the 25 need behavior the MP marks not-modeled | S-011 produces a matrix with a recommendation per concept; owner approves. Default: drop `lab` from not-modelable concepts (they stay quiz-only) | owner (prepared by S-011) | S-080 and all S-08x; `sdlab` Unit 0 lab writing |
| OD-5 | Unit 0 lab scope (part of OD-4) | One lab owned by `single-machine-limits`, secondary `connection-pooling`; threads and connection pool only, all `modeled` (pool exhaustion is plain M/M/c queueing). CPU, memory and disk stay in the lesson and quiz. `indexes-query-basics` drops `lab` (needs a query-cost model; MP R5 says quiz-only). The illustrative "bigger pool is slower" curve (A-M4) is optional (S-025b) | owner | S-080; sdlab P1-048 sub-ticket for that concept |
| OD-6 | Confirm D8 and D11 | Confirm both | owner at SG0 | S-007 |
| OD-7 | Build our own engine or adopt an MIT engine (Breakscale, loadsketch) | Decide from spike D. Default and estimates assume **build** | owner at SG0 | S-020 |
| OD-8 | UI rendering choice for topology (React Flow vs hand-rolled SVG) | Decide from spike C. Expected: **SVG**, because tune-mode topologies have at most about 8 fixed nodes and React Flow costs bundle size | owner at SG0 | S-061 |
| OD-9 | Agent capacity: sessions per week, and whether two tracks run in parallel | Two tracks (engine/contract and UI/quiz) at about 8 sessions a week until BG1 | owner | schedule only |
| OD-10 | Lesson pages in the beta (in addition to quiz and lab) | Yes, one session (S-102), first to cut | owner | S-102 |

Resolved since the master plan: MP Q3 (sdlab visibility for the drift check). `Alfthrpy/sdlab` is **public** (checked with `gh repo view` on 2026-11-16), so drift checks and the content bundle can read it without a token. MP Q1/Q2 (start the simulator track, create the repo) are answered by ADR 0007 and ADR 0002, except the remote itself (OD-1).

---

## 3. Architecture

### 3.1 Layers (MP 4.1, kept)

| Layer | Package | Depends on | Responsibility | Runs in |
| --- | --- | --- | --- | --- |
| L0 Contract | `contract/` | nothing | Catalog (components, policies, scenarios, metrics, structural predicates) with parameter types, units, ranges, defaults, honesty labels and evidence ids; JSON Schema for lab and incident specs; `i18n/id.yaml`; semver and changelog; conformance fixtures | Build time; released as an artifact; vendored into `sdlab/contracts/sim/` |
| L1 Engine | `packages/engine` | L0 types | Event heap, simulated clock, seeded RNG streams, components, edge policies, scenario injectors, metrics recorder. No DOM, no wall clock | Web Worker; Node (tests, CLI) |
| L2 Lab runtime | `packages/lab-runtime` | L0, L1 | Load and validate a spec, apply learner edits, run K seeds, evaluate targets and structural rules, return result ids and values (no prose) | Web Worker; Node (lab CI) |
| L2' CLI | `packages/cli` (added) | L0, L2 | `sdsim validate` (C01-C05 against the contract), `sdsim lab-ci` (MP 6.4 checks); shipped as a release tarball for `sdlab` CI | Node |
| L3 UI | `packages/ui`, `apps/web` | L0, L2 by messages only | Topology view, parameter sheet, charts, grading result, hints, debrief, honesty badges; quiz player and lesson view (beta app); Indonesian text from `id.yaml` and from the spec | Main thread |

Worker protocol (MP 4.1): `init(spec, seed)` → `edit(changes)` → `run(mode: play | skip | grade)` → `snapshot` at about 10 Hz (per-node metrics plus at most 200 sampled request tokens) → `result`. Grading always runs in skip mode over K seeds, one Worker per seed up to `hardwareConcurrency - 1`.

What runs where: everything runs in the learner's browser. The build (contract build, content bundle, Vite) runs in GitHub Actions. There is no server and no data leaves the browser.

### 3.2 Repo layout (MP 10.1, reconciled)

```
sdsim/
  AGENTS.md  CLAUDE.md  README.md  LICENSE            (exist except LICENSE, OD-1)
  package.json  package-lock.json  tsconfig.base.json  eslint.config.js  .prettierrc  .nvmrc
  contract/            catalog.yaml, lab-spec.schema.json (generated parts marked), i18n/id.yaml,
                       CHANGELOG.md, fixtures/{valid,invalid}/, build.ts  -> dist/contract/
  packages/engine/     src/{kernel,rng,components,policies,scenarios,metrics}/  (lib: ES2023, no DOM)
  packages/lab-runtime/ src/{load,edits,grade,structural}/
  packages/cli/        src/ (validate, lab-ci)                       (added: MP left the CLI unplaced)
  packages/ui/         src/{topology,sheet,charts,result,quiz}/
  apps/web/            Vite static site: lab page, quiz, lesson, home; content bundle import
  validation/          oracles/, invariants/, reproductions/, sensitivity/, golden/, behavior/ (V10)
  docs/                PLAN.md, HANDOFF.md, ROADMAP.md, workflow.md, conventions/, decisions/,
                       model/<component-id>.md, spikes/
  backlog/  sessions/  templates/  scripts/ (Python ticket tooling, exists)  tests/ (ticket tooling tests)
  .claude/agents/  .claude/commands/
  .github/workflows/   tickets.yml (exists), ci.yml, drift.yml, release.yml, pages.yml
```

Changes from MP 10.1: `packages/cli` added; `pages.yml` added for the deploy; ADR numbers shift (MP says "ADR 0001 build-vs-adopt", but 0001 and 0002 exist here, so SG0 records the next free number).

### 3.3 Data flow

```
sdlab lab.yaml ──(validated by sdlab validate.py + vendored schema)──┐
                                                                     ▼
contract/catalog.yaml ─build─> catalog.json + lab-spec.schema.json ─> lab-runtime.load(spec)
                                                                     │  K seeds, skip mode
                                   engine (Worker) <─ edits ─────────┘
                                         │ snapshots 10 Hz / result
                                         ▼
                                  UI (main thread) ── text from id.yaml + spec

sdlab content (lessons, questions) ─pinned commit─> content bundle (JSON) ─> apps/web quiz/lesson
```

---

## 4. Reconciliation (master plan vs ADR 0007 vs sdlab docs vs this repo)

| # | Topic | Master plan says | Other source says | Resolution in this plan |
| --- | --- | --- | --- | --- |
| R1 | Repo name | `stud-sim` (MP 10) | `sdsim` (ADR 0002, owner's folder) | `sdsim` |
| R2 | G2 gate | Caching lab piloted with 5 users at week 9; SC6 measures it (MP 8.1, D9) | ADR 0007: the owner tests alone; the 5-user pilot is deferred until before any public beta | BG1 = owner runs the caching lab and quiz on his phone (S-071). SC6 moves to S-093, before public beta. S-072 no longer depends on `sdlab:P1-034` |
| R3 | Schedule baseline | Week 1 = week of 2026-11-12; G1 at week 6, G2 at week 9 (MP 8) | G1 was approved on 2026-11-16 (P1-024 done); P1-032 and P1-033 are done on branches | sdlab is ahead of the MP schedule; the simulator is now the critical path. This plan uses calendar dates from 2026-11-17 |
| R4 | Lab list | 16 labs from provisional ids (MP R5); G1 approves the list (MP 5.4) | G1 approved 50 concepts; 25 list `lab` in `formats` (`concepts.yaml`). Some need not-modeled behavior: `indexes-query-basics` (query cost), `isolation-levels`, `locks-leases-fencing`, `distributed-transactions` (MP R5: quiz-only); the failover half of `replication-lag-failover` (MP R3: not in the v1 catalog). Some MP labs have no `lab` flag: `cdn` (L06), `percentiles-tail-latency` (L03), `metastable-failure` (L16) | S-011 builds the real matrix; the owner decides (OD-4). A lab is valid only in the intersection (MP 5.1). Proposed `sdlab` edits go through an sdlab ticket |
| R5 | Unit 0 lab | One lab "limits of one machine" + connection pooling, threads and connections only (MP R5, D4) | `concepts.yaml` lists `lab` for 3 Unit 0 concepts; `single-machine-limits` objective 1 names CPU, memory and disk | OD-5: one lab, threads and pool only, all modeled; CPU/memory/disk stay in lesson and quiz |
| R6 | Lab-spec fields | MP 6.1 table and example | content-schema.md §5 adds `brute_force: true` on wrong answers, `feedback_pass/fail` on structural rules, `secondary_concepts`, `palette: [{type, max}]`, edges as `[from,to]` or `{from,to,policies}`; unknown fields are errors | The JSON Schema in S-010 accepts exactly the §5 shape (with `additionalProperties: false`) and fills the §5 "Not yet specified" list: predicate argument shapes, edge `policies`, scenario fields, metric ids and units, `build` solution shape, meaning of every node parameter |
| R7 | Parameter names | MP 4.3 names parameters loosely ("service mean", "capacity %") | The real lab uses `timeout_ms`, `retries`, `instances`, `threads`, `service_ms`, `mode`, `keys`, `skew`, `capacity_pct`, `ttl_s`, `pool`, `read_ms`, `write_ms` | The catalog adopts the names the real lab uses; unit suffixes (`_ms`, `_s`, `_pct`) become the convention for new parameters |
| R8 | DB in the slice | MP S2 list omits S-025 (DB) but the caching lab has a `db` node with `pool`, `read_ms`, `write_ms`; also omits a client ticket though the lab has a `client` with `timeout_ms` | — | Split S-025 into S-025a (pool + read/write service, in the slice), S-025b (A-M4 contention, optional), S-025c (replicas, lag). Split S-023 into S-023a (schedule, open-loop arrivals, timeout; in the slice) and S-023b (retries, backoff, jitter, budget, idempotency key) |
| R9 | Contract 1.0.0 freeze | After the G2 pilot (S-072 after S-071 and `sdlab:P1-034`) | No pilot; Unit 0 lab comes right after | Freeze after BG2 (caching lab and Unit 0 lab both run), so two real labs shape 1.0.0. While 0.x, minors may break (MP 5.2 amendment) |
| R10 | Incident scenario ids | Scenario catalog has 8 ids (MP 4.4); GCP Service Control is "restart herd without backoff" via existing scenarios (MP 6.7) | content-schema.md §6 example uses `sim_scenarios: [restart-herd]` | The catalog is authoritative. S-010 does not add `restart-herd`; the GCP case is `instance-crash` with restart plus client retries without backoff. Flag the example to sdlab (cross-repo list, section 10.4) |
| R11 | Spike B | Separate throwaway spike in week 2-3 (S-004) | — | Merged into S-041 (V4(a)), run on the real engine once retries exist. It decides only L16's label (MP 9 SG0 paragraph), so it does not belong before SG0 |
| R12 | Spike A code | Spike code is thrown away (MP 9) | Owner: built to keep running | Spike A builds the kernel (heap, clock, RNG streams, M/M/c station) in `packages/engine` to production conventions; if A fails, it is rewritten anyway. S-020 shrinks to run control and the Worker protocol |
| R13 | Determinism across runtimes | Bit-identical replay only within one JS engine; across browsers only statistics (MP 4.6, A-E1) | `docs/conventions/engineering.md` says "byte for byte, in Node and in a browser Worker" | Both hold if "browser" means Chrome (V8, same as Node). Golden hashes are checked on Node and in Chromium; Firefox and WebKit are compared statistically (V9). Fix the wording in engineering.md in S-001 |
| R14 | "No iteration over unordered maps" | MP 4.6 lint ban | JS `Map` and `Set` iterate in insertion order, so they are deterministic when inputs are | The rule becomes: no iteration whose order depends on anything but simulation inputs (no `WeakMap` iteration, no sort with a non-total comparator, no object keys that mix integer-like and string keys). S-003 confirms |
| R15 | Ticket types | infra, spike, code, validation, integration, curriculum, decision (MP 10.3) | `scripts/common.py`: infra, spike, contract, engine, ui, lab, validation, decision, review, release | Use the repo's types: code → engine or ui; integration → lab; curriculum → lab |
| R16 | Cross-repo `depends_on` | `sdlab:<id>` supported by S-001 (MP 10.3) | `scripts/validate.py` here accepts only `S-xxx` ids; `sdlab`'s validator rejects unknown ids (MP 11.5 finding 1, P-12) | S-002 adds the `sdlab:` prefix here. `sdlab` needs P-12 before it lists `sdsim:` edges |
| R17 | Quiz and lesson app | Out of scope ("Phase 3, the app", MP 2) | ADR 0007: next goal is a working quiz **and** lab | Minimal quiz player and lesson view in `apps/web` (S-100 to S-102), no accounts; OD-3 |
| R18 | UI packages | `packages/ui` and `apps/web` | — | Kept as in MP and engineering.md |
| R19 | Grading result UI | No ticket shows targets, feedback, hints and debrief (MP 10.4 has S-061 tune and S-062 charts only) | MP 6.2, 6.3 A4 require them | Added S-068 |
| R20 | TypeScript version | Not fixed (MP R4 lists tools only) | npm registry, 2026-11-16: `typescript` latest is 7.0.2, but `typescript-eslint` 8.72.2 requires `typescript >=4.8.4 <6.1.0` | Pin TypeScript 6.0.3; revisit TS 7 when typescript-eslint supports it |
| R21 | YAML dialects | Not addressed | `sdlab` parses with PyYAML (YAML 1.1); the TS loader uses `yaml` (YAML 1.2). They differ on bare `yes/no/on/off` and some number forms | Conformance fixtures include these cases; the schema requires quoted strings where it matters (e.g. `contract_version`, `op`); propose a style note to sdlab |
| R22 | Caching lab trade-off | MP 6.1 example | HANDOFF §5: the pilot does not make long TTL costly, so staleness is not taught | Not a simulator change for BG1. A second caching lab with a write path and `stale_read_ratio` needs S-025c; listed in S-011 as a candidate |

---

## 5. Toolchain

### 5.1 Principles

Boring, widely used, MIT/ISC/Apache-2.0, pinned exact versions (`save-exact`), one package manager, one test runner for all TS packages. Every dependency is listed in the ticket that adds it (engineering.md).

### 5.2 What is verified and what is assumed

- **Verified on 2026-11-16** (npm registry via `npm view`, and the local machine): the versions, licenses and Node engine ranges in the table below; local Node 24.22.0, npm 11.19.1, Python 3.14.8, gh 2.97.0; the typescript-eslint peer range (R20); `Alfthrpy/sdlab` is public.
- **Assumed, verified by the named ticket:** GitHub Actions minutes are free for public repos (S-001); `npx` can run a CLI from a GitHub release tarball URL (S-052); GitHub Pages serves a Vite build with a sub-path base and module Workers (S-060); uPlot 1.6.32 (last release 2025-03-14) works with current browsers (S-005); `pure-rand` 8 offers splittable or jumpable generators good enough for per-stream seeding (S-003); `flatqueue` supports the tie-break key via a composite priority (S-003). Node 24 is assumed to be an LTS line; CI follows `.nvmrc`.

### 5.3 Choices

| Need | Choice (version) | License | Why |
| --- | --- | --- | --- |
| Runtime | Node 24 (`.nvmrc` = 24) | — | Matches the local machine; Vite 8 and Vitest 5 require Node ≥ 22.12 |
| Language | TypeScript 6.0.3, `strict`, `noUncheckedIndexedAccess`, ES modules only | Apache-2.0 | Engine purity is enforced through `lib` (section 9.2); 7.x blocked by typescript-eslint (R20) |
| Package manager | npm 11 workspaces, committed `package-lock.json`, `npm ci` in CI | — | Ships with Node; no extra tool; the MP's `npx` release flow is npm-native |
| Test runner | Vitest 5.1.0 | MIT | MP R4 choice; one runner for unit, oracle, property and golden tests |
| Property tests | fast-check 4.10.2 | MIT | MP R4; V7 |
| Seeded RNG | pure-rand 8.4.2 | MIT | MP R4; zero dependencies |
| Event queue | flatqueue 3.1.0 (or a 60-line own heap if the tie-break needs it) | ISC | MP R4 |
| YAML | yaml 2.9.1 | ISC | MP R4; reads `catalog.yaml`, `id.yaml` and lab specs in TS |
| JSON Schema | Ajv 8.20.0 (`ajv/dist/2020`), schema draft 2020-12; `jsonschema` 4.26.0 on the sdlab side (MP 5.2) | MIT | One schema format for Python and TS |
| Types from schema | json-schema-to-typescript 16.0.0 (build step) | MIT | Spec types are generated, never hand-copied |
| TS script runner | tsx 4.23.15 | MIT | `contract/build.ts`, CLI dev runs |
| Bundler / dev server | Vite 8.3.8 | MIT | Static build, module Workers, sub-path base |
| UI framework | React 19.3.1 + react-dom | MIT | Most widely known by agents; required if spike C picks React Flow. Fallback if the 300 KB budget fails: Preact via `preact/compat` |
| Topology | Hand-rolled SVG (expected) or @xyflow/react 12.12.1 | MIT | Decided at SG0 from spike C (OD-8) |
| Charts | uPlot 1.6.32 | MIT | MP R4; small and fast for time series |
| Styling | Plain CSS with CSS modules (Vite built-in), CSS custom properties for tokens | — | No CSS framework to learn or update |
| Routing | Hash routing written in the app (3-5 routes) | — | Works on GitHub Pages without rewrites; no dependency |
| Lint | ESLint 10.15.0 + typescript-eslint 8.72.2 + eslint-plugin-boundaries 7.4.4 | MIT | Engine bans (`no-restricted-globals`, `no-restricted-properties`), layer boundaries |
| Format | Prettier 3.10.1 | MIT | Default config |
| Browser tests | @playwright/test 1.65.1 (Chromium in every PR; Firefox and WebKit weekly for V9) | Apache-2.0 | Mobile viewport e2e (360 x 800), A3/A5 measurements, V9 |
| Bundle budget | size-limit 14.3.0 | MIT | Lab page JS ≤ 300 KB gzip in CI (MP spike C3) |
| Ticket tooling | Python 3 + PyYAML (exists) | — | Ported from sdlab |
| CI | GitHub Actions: `tickets.yml` (exists), `ci.yml`, `drift.yml`, `release.yml`, `pages.yml` | — | MP 10.3 |

Not chosen: pnpm or yarn (extra tool, no gain at this size), Biome (ESLint's restricted-syntax rules and boundaries plugin are what the engine bans need), Tailwind (build complexity), a state library (React state is enough for one lab page), Comlink (plain `postMessage` with a typed message union, MP R4), PWA/offline (D6 says not required).

### 5.4 Release and version pinning flow

| Artifact | Tag | Contents | Consumer |
| --- | --- | --- | --- |
| Contract | `contract-vX.Y.Z` | `catalog.json`, `lab-spec.schema.json`, `CHANGELOG.md`, `fixtures/` (conformance), `VERSION` (version + sha256 of `catalog.json`) attached to a GitHub release | `sdlab/contracts/sim/` via a bump ticket that runs `validate.py` (MP 5.2) |
| Simulator CLI | `sim-vX.Y.Z` | `npm pack` tarball of `packages/cli` with its bundled engine and runtime (`sdsim-cli-X.Y.Z.tgz`), attached to the release | `sdlab` CI: `npx --yes https://github.com/<owner>/sdsim/releases/download/sim-vX.Y.Z/sdsim-cli-X.Y.Z.tgz lab-ci content` |
| Web app | every merge to `main` | Static build deployed by `pages.yml` | the owner's phone |

`sdlab/contracts/sim/VERSION` records the contract version, its sha256, and the simulator release (version and commit) whose lab CI was last green (MP 5.2 amendment). No npm registry publishing ($0, MP 5.2).

---

## 6. Vertical-slice strategy

### 6.1 The order

1. **I0 Walking skeleton** (inside S2): a deployed page on the owner's phone runs an M/M/c station in a Worker and draws a live chart, with mean latency checked against the oracle. Proves: toolchain, Worker, deploy, phone rendering, engine speed. About 14 sessions in.
2. **BG1 Caching beta slice** (end of S2): the real `caching-basics` lab runs and grades; the caching-basics quiz runs. The owner uses both on his phone.
3. **BG2 Unit 0** (pulled ahead of S3): contract and CLI released, `sdlab` vendors them, the Unit 0 lab runs; contract 1.0.0 freezes.
4. **S3 Engine complete and validated**, then **S4 labs per unit** in M4 order (Units 1, 2, 6, 3, 4, 5), then **S5** incidents, QA, the deferred 5-user pilot, release.

### 6.2 Why this order reduces risk

| Risk retired early | By |
| --- | --- |
| The engine is too slow or non-deterministic on a phone (A-M1, A-E1) | Spike A measures before any component work; I0 runs on the real phone |
| The mobile UI does not work at 360 px | Spike C and the owner's phone trial before SG0; I0 again on the deployed site |
| The contract cannot express real specs | S-010 must accept the real caching `lab.yaml` and sdlab's own fixtures before the runtime is written |
| A lab teaches a false mechanism | The caching slice is the first lab to pass MP 6.4 lab CI and V4(d) (cold-cache shape) |
| Two repos drift | BG2 forces the full contract release → vendor → pinned CLI loop with only two labs in existence |
| Building breadth on a wrong base | Components beyond the slice (retries, breakers, replicas, queues) wait until two real labs ran end to end |

The Unit 0 lab is cheap after BG1: under OD-5 it needs only components already in the slice (client, api-server, db pool) and a traffic ramp, so BG2 is mostly integration.

### 6.3 Beta slice: the minimal ticket set

BG1 needs exactly: S-001, S-002, S-003, S-005, S-006, S-007\*, S-008\*, S-009\*, S-010, S-013, S-020, S-021, S-022, S-023a, S-024, S-025a, S-040, S-050, S-051, S-060, S-061, S-062, S-068, S-070, S-100, S-101, S-071\* (\* = owner). S-102 (lessons) is in the slice if OD-10 is yes. That is **33 agent sessions** (34 with S-102) plus 4 owner tickets.

BG2 adds: S-011, S-012, S-052, S-053, S-030a, S-080, S-072, optionally S-025b: **7 agent sessions** (8 with S-025b), plus `sdlab` work (section 10).

---

## 7. Milestones and exit gates

### 7.1 Capacity assumptions behind the estimates

- One **session** is one agent run that finishes one ticket or sub-ticket with review (MP 10.3: tickets of 1-3 sessions; a 2-session ticket is split when it starts).
- MP 8.2 assumed 5 simulator sessions a week in weeks 2-9 and 2-3 a week after. That still holds for a single track. With two parallel tracks (engine/contract and UI/quiz) about 8 a week is realistic until BG1, limited by owner review and merges (OD-9).
- The MP's estimates per ticket are kept unless a row in section 8 says why. HANDOFF §7 notes that every sdlab review round found real defects; the estimates include one fix round per ticket, not two. Expect about 15% overrun.
- Owner time is listed per gate; the MP total (about 19 hours) rises to about 25 hours with the beta checks and the deferred pilot.

### 7.2 Milestone table

| Milestone | Entry | Deliverables | Exit gate (measurable) | Owner decisions | Agent sessions |
| --- | --- | --- | --- | --- | --- |
| **S0 Bootstrap & spikes** | Plan approved; OD-1 remote created (or work proceeds locally with PRs queued) | Toolchain and CI (S-001), `sdlab:` deps (S-002), spike A kernel and measurements (S-003), spike C mobile prototype (S-005), spike D (S-006), owner measurements (S-008) | **SG0 (S-007)**: GO when A1-A3 pass and A5 or its precompute fallback works (MP 9). Canvas choice recorded; build vs adopt recorded; D8/D11 confirmed. Recorded as an ADR | OD-1, OD-6, OD-7, OD-8 | 7 |
| **S1 Contract v0** | S-001 done | Catalog v0 (all 12 components, policies, 8 scenarios, metrics, predicates; ranges; honesty + evidence/assumption ids), JSON Schema, conformance fixtures, `id.yaml` v0, lab matrix, contract release, drift check | `contract-v0.1.0` tag exists; the real `caching-basics/lab.yaml` validates; every valid and invalid fixture from `sdlab/tests/test_labs.py` that concerns structure gets the same verdict from Ajv; S01, S02, S05, S06 pass in CI; owner approved the lab list (S-011) | OD-4, OD-5 | 6 |
| **S2 Caching vertical slice (BG1)** | SG0 GO; S-010 done | Engine run control, metrics, service node, client (basic), cache, db (pool), validation suite, lab runtime, lab CI checker, web shell, tune UI, charts, result view, content bundle, quiz player (lesson view if OD-10) | **BG1 (S-071)**: (1) caching lab: baseline fails ≥ 9/10 seeds, reference passes 10/10 with MP 6.4 margins, both wrong answers fail ≥ 9/10; (2) V1 (M/M/1, M/M/4, M/D/1, M/G/1, fan-out), V2, V4(d), V6, V7 green in CI; (3) on the owner's phone: no horizontal scroll at 360 px, every control ≥ 44 px, grading of the caching lab finishes in ≤ 5 s with a progress bar, the owner reaches a pass without pinch-zoom; (4) the owner finishes the caching-basics quiz (all 5 question types render and score); (5) lab page JS ≤ 300 KB gzip; (6) owner findings recorded in S-071 Notes | OD-2, OD-3, OD-10 | 25 (incl. S-052 if done early; 24 without) |
| **BG2 Unit 0 lab** (milestone label S4, done before S3) | BG1 passed; OD-5 decided; sdlab has written the Unit 0 lab spec (P1-048 sub-ticket) | Released CLI, drift check running lab CI, traffic-spike/cache-flush scenarios, Unit 0 engine needs, contract 1.0.0 | `sim-v0.x` tarball runs in `sdlab` CI; `sdlab` lab CI green for the caching lab and the Unit 0 lab at the pinned CLI; `contract-v1.0.0` tagged with a migration note; the owner runs the Unit 0 lab on his phone | owner approves the freeze (S-072, `review: human`) | 3 (+1 optional S-025b); S-011, S-012, S-052 and S-053 are counted in S1/S2 |
| **S3 Engine complete & validated** | BG2 done | Client retries/backoff/jitter/budget/idempotency key, DB replicas and lag, LB, queue and worker, rate limiter/CDN/object storage/external dependency/DNS, circuit breaker, remaining scenarios, partitions and quorum, V4(a) (with the spike B question), V4(b), V5, V10, final limitations statement | Every `modeled` catalog entry names a passing V1/V3/V4/V10 check (S05 green); V1-V7 and V10 green; model-reviewer has no open finding on any `docs/model/<id>.md`; L16 label decided (modeled if V4(a) passes in ≥ 8/10 seeds, else illustrative) | none new | 15 |
| **S4 Labs per unit** | S3 component tickets the unit needs are done; the unit's lab specs exist in sdlab | Engine support per unit in M4 order: Unit 1 (S-081), Unit 2 (S-082), Unit 6 (S-083), Unit 3 (S-084), Unit 4 (S-085), Unit 5 (S-086); UI: animation, compare, diagnose, build, i18n/a11y | Per unit: `sdlab` lab CI green at the pinned CLI for every approved lab of the unit; V5 green for those labs. Modes: diagnose two-step grading works; compare uses common random numbers | owner may apply the cut order (MP 8.3) | 14 |
| **S5 Incidents, QA, release** | All S4 units closed or cut | Incident mode (S-090), QA (S-091), deferred 5-user pilot support (S-093), release (S-092) | SC1-SC5, SC7, SC8 green (S-091 report); SC6 measured in the 5-user pilot before any public beta; `sim-v1.0.0` tagged on the commit `sdlab` P1-064 tested | owner runs the pilot and SG3 | 4 |
| **Total** | | | | | **75** (MP: 67) |

### 7.3 Calendar (estimate, from 2026-11-17)

| Point | Single track, 5 sessions/week | Two tracks, about 8/week until BG1 |
| --- | --- | --- |
| SG0 | about 2026-11-27 | about 2026-11-25 |
| I0 walking skeleton | about 2026-12-04 | about 2026-12-02 |
| BG1 | about 2027-01-08 (holidays add slack; mid-January realistic) | about 2026-12-19 |
| BG2 | about 2027-01-22 | about 2027-01-09 |
| S3 + S4 + S5 (33 sessions at 2-3/week, MP 8.2) | about 2027-05 | about 2027-04 |

Reconciliation with MP 8.2: the MP needed 33 sessions in weeks 2-9 (S0+S1+S2) and about 34 after. This plan's S0+S1+S2 milestones total 38 sessions (BG1 itself needs 33, or 34 with lessons), and 37 come after. The net difference of +8 is: added quiz and lesson pages (+4), `sdlab:` deps S-002 (+1), `id.yaml` S-013 (+1), result view S-068 (+1), drift-with-lab-CI S-053 (+1), the third DB split S-025b (+1, optional), the deferred pilot S-093 (+1), spike B's work moved into S-041 (+1); removed: S-004 (-1), part of S-020 (-1), S-071 as an agent ticket (-1).

Never cut (MP 8.3, kept): V1, V2, V4(a), lab CI (MP 6.4), validators C01-C11 and S01-S05, the limitations page, and mobile tune mode.

Checkpoint (MP 8.2 rule, kept): if I0 is not reached by the 16th agent session, apply the slice cuts: drop S-102, keep only one chart in S-062, defer S-013 strings beyond the caching lab. If BG1 is still at risk after 34 sessions, move the BG1 date rather than show a lab without lab CI passing.

---

## 8. Ticket backlog

Legend. **Δ**: `=` kept from MP 10.4; `C` changed; `A` added; `D` dropped. **Slice**: `B1` needed for BG1, `B2` needed for BG2. **Rev**: review mode. Owner tickets have `owner: human`, `review: none`. Estimates are agent sessions. All ids are free in this repo today.

### 8.1 S0 Bootstrap & spikes

| id | Title | Type | Depends on | Est | Rev | Outputs | Δ | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-001 | Toolchain and CI skeleton: npm workspaces, TS 6.0.3, Vitest, ESLint bans and boundaries, Prettier, `ci.yml`; `git init`; fix engineering.md wording (R13); add a `ux-reviewer` subagent stub | infra | — | 1 | human | root config, `packages/*/package.json`, `.github/workflows/ci.yml`, ADR for toolchain | C: workflow docs already exist; this is the code toolchain | B1 |
| S-002 | Ticket tooling: accept `sdlab:<id>` in `depends_on`, read status from `../sdlab` when present, fixture tests | infra | S-001 | 1 | agent | `scripts/`, `tests/` | A (R16) | B1 |
| S-003 | Spike A: kernel in `packages/engine` (heap, clock, RNG streams, M/M/c station, Worker bridge); measure A1-A6 | spike | S-001 | 2 | agent | `packages/engine/src/kernel`, `docs/spikes/A.md` | C (R12: code kept) | B1 |
| S-005 | Spike C: mobile tune-mode prototype, React Flow vs SVG, bottom sheet, one uPlot chart; measure C1, C3, C4; prepare C2 for the owner | spike | S-001 | 2 | agent | `docs/spikes/C.md`, prototype branch, screenshots | = | B1 |
| S-006 | Spike D: build vs adopt (Breakscale, loadsketch), score D1-D6 with evidence | spike | S-003 | 1 | agent | `docs/spikes/D.md` | = | B1 |
| S-007 | SG0: go/no-go, canvas, build vs adopt, confirm D8/D11 | decision | S-003, S-005, S-006, S-008 | owner 1 h | none | ADR (next free number) | = | B1 |
| S-008 | Owner measurements: reference laptop model and CPU; phone model; C2 phone trial of the spike C prototype | decision | S-005 | owner 1 h | none | `docs/spikes/C.md` Notes, `docs/spikes/A.md` device line | A (MP folded this into spikes; an agent cannot do it) | B1 |
| S-009 | Owner setup: GitHub remote, visibility, license, Pages enabled (OD-1, OD-2) | infra | — | owner 0.5 h | none | remote, `LICENSE` | A | B1 |
| ~~S-004~~ | Spike B | — | — | — | — | — | D: merged into S-041 (R11) | — |

### 8.2 S1 Contract v0

| id | Title | Type | Depends on | Est | Rev | Outputs | Δ | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-010 | Contract v0.1.0: `catalog.yaml` (12 components, policies, 8 scenarios, metrics with `min_abs_margin`, predicates with argument shapes), JSON Schema matching content-schema §5, conformance fixtures (incl. the real caching lab and YAML-dialect cases), changelog, `build.ts`, checks S01, S02, S05, S06 | contract | S-001 | 2 | agent | `contract/` | C: depends on S-001 not S-007 (the catalog is ours in both build and adopt); must accept R6/R7 | B1 |
| S-011 | Lab matrix with real concept ids: per `lab` concept, modelability, needed components, owning vs secondary concept, recommendation; proposal text for sdlab | lab | S-010 | 1 | human | `docs/lab-matrix.md` | C: G1 already happened; output is the OD-4/OD-5 decision | B2 |
| S-012 | Contract release workflow (`release.yml`, `contract-v*` tags) and schema-level drift check (C01-C05 against sdlab `main`, nightly) | infra | S-010, S-009 | 1 | agent | `.github/workflows/{release,drift}.yml` | C: lab-CI part moved to S-053 | B2 |
| S-013 | `contract/i18n/id.yaml` v0: UI chrome, component/metric labels, mechanism templates for the slice; reviewed by sdlab's `content-reviewer` | contract | S-010 | 1 | agent | `contract/i18n/id.yaml` | A (MP put i18n in the contract but gave no ticket) | B1 |
| S-053 | Drift check runs MP 6.4 lab CI on every sdlab spec (S03, S04) against the last green sdlab commit | validation | S-012, S-051 | 1 | agent | `drift.yml`, `packages/cli` | A (split from S-012) | B2 |

### 8.3 S2 Caching vertical slice and beta app

| id | Title | Type | Depends on | Est | Rev | Outputs | Δ | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-020 | Engine run control and Worker protocol (init/edit/run/snapshot/result), event budget | engine | S-007 | 1 | agent | `packages/engine/src/kernel` | C: 2 → 1 (kernel built in S-003) | B1 |
| S-021 | Metrics recorder: 1 s buckets, log histogram (≤ 1% error), Little counters, per-logical-request accounting (MP 4.5) | engine | S-020 | 1 | agent | `packages/engine/src/metrics` | = | B1 |
| S-022 | Service node: slots, gamma service, queue bound, FIFO/LIFO, concurrency limit, fan-out; sync-call slot holding; V1 oracles | engine | S-020 | 2 | agent | `components/service`, `docs/model/api-server.md` | = | B1 |
| S-023a | Client basic: rate schedule, open-loop Poisson, read/write mix, per-attempt timeout, censored latency | engine | S-022 | 1 | agent | `components/client` | C (R8) | B1 |
| S-024 | Cache: Zipf keys, LRU capacity (`capacity_pct` of `keys`), TTL, look-aside and read-through, coalescing; emergent hit ratio; V4(d) | engine | S-022 | 2 | agent | `components/cache`, `docs/model/cache.md` | = | B1 |
| S-025a | DB basic: pool as slots, `read_ms`/`write_ms`, write commit point (MP 4.2) | engine | S-022 | 1 | agent | `components/db`, `docs/model/db.md` | C (R8) | B1 |
| S-040 | Validation suite wiring: V1, V2 on every run in test mode, V6 golden hashes, V7 property tests; Ciw license check (G5) | validation | S-021, S-022 | 2 | agent | `validation/` | = | B1 |
| S-050 | Lab runtime: load (Ajv + catalog checks), edits, K = 5 seeds, targets, structural rules, result ids | engine | S-010, S-021 | 2 | agent | `packages/lab-runtime` | = | B1 |
| S-051 | Lab CI checker: baseline, reference, wrong answers, margins, flake check, time budget, C12-C13 | validation | S-050 | 1 | agent | `packages/cli` (lab-ci), `validation/labs` | = | B1 |
| S-060 | Web shell: Vite app, Worker bridge (from spike A), hash routes, mobile layout, Pages deploy (`pages.yml`), Playwright smoke at 360 x 800 | ui | S-007, S-013, S-009 | 2 | agent | `apps/web`, `pages.yml` | = | B1 |
| S-061 | Topology view and parameter sheet (tune mode), honesty badges | ui | S-060 | 2 | agent | `packages/ui/{topology,sheet}` | = | B1 |
| S-062 | Time-series charts and metric cards with target lines (uPlot, 10 Hz); I0 demo page (M/M/c station on the S-020 protocol, oracle value shown) | ui | S-060, S-021, S-022 | 1 | agent | `packages/ui/charts` | = | B1 |
| S-068 | Grading result view: per-target value vs target, structural rule feedback, mechanism line, tiered hints, debrief rule A4, progress bar | ui | S-061, S-050 | 1 | agent | `packages/ui/result` | A (R19) | B1 |
| S-070 | Vertical slice: caching lab from sdlab end to end; lab CI and V5 subset for L05; propose recalibration to sdlab if needed | lab | S-023a, S-024, S-025a, S-040, S-051, S-061, S-062, S-068 | 1 | agent | `validation/labs/caching-basics`, Notes | C: deps updated (R8); `sdlab:P1-032` is done | B1 |
| S-100 | Content bundle: read a pinned `sdlab` commit (lessons, questions, lab specs), emit JSON for `apps/web`; lock file with the commit | ui | S-060, S-002 | 1 | agent | `apps/web/scripts/bundle.ts`, `apps/web/content.lock` | A (R17) | B1 |
| S-101 | Quiz player: mcq, multi, order, match, estimate; explanations; concept list; progress in `localStorage` | ui | S-100 | 2 | agent | `packages/ui/quiz`, `apps/web` routes | A (R17) | B1 |
| S-102 | Lesson view: Markdown with `[^id]` source markers resolved from the registry | ui | S-100 | 1 | agent | `packages/ui/lesson` | A (R17; OD-10; first to cut) | B1 (optional) |
| S-071 | BG1: owner beta check of caching lab and quiz on his phone; findings in Notes | review | S-070, S-101 | owner 1 h | none | Notes | C (R2: owner instead of 5 testers) | B1 |
| S-052 | Simulator CLI release tarball (`sim-v*`), conformance fixtures shipped; verify `npx` from a release URL | release | S-051, S-012 | 1 | agent | `release.yml`, `packages/cli` | = | B2 |

### 8.4 BG2 Unit 0 lab (milestone labels as noted)

| id | Title | Type | Milestone | Depends on | Est | Rev | Outputs | Δ | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-030a | Scenario injectors: `traffic-spike`, `cache-flush` | engine | S3 | S-022, S-024 | 1 | agent | `packages/engine/src/scenarios` | C (split of S-030) | B2 |
| S-025b | DB pool contention past a knee (A-M4), illustrative, with the property test | engine | S3 | S-025a | 1 | agent | `components/db` | C (split; optional under OD-5) | B2 opt |
| S-080 | Unit 0 lab support: engine needs for the approved Unit 0 lab; verify against the sdlab draft spec with the pinned CLI | lab | S4 | S-011, S-030a, S-052, S-053, `sdlab:<P-05 ticket>`, `sdlab:<Unit 0 lab sub-ticket>` | 1 | agent | Notes, fixes | C: no longer after S-072 (R9) | B2 |
| S-072 | Contract 1.0.0 freeze from BG1 findings and the Unit 0 lab; migration note for sdlab (P-16) | contract | S3 | S-071, S-080 | 1 | human | `contract/CHANGELOG.md`, tag | C (R9) | B2 |

`sdlab:<…>` placeholders are filled with real ids when sdlab creates those tickets (section 10.4); S-080 cannot be claimed before then.

### 8.5 S3 Engine complete and validated

| id | Title | Type | Depends on | Est | Rev | Outputs | Δ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S-023b | Client retries, backoff, jitter, retry budget, `idempotency-key` and `timeout`/`retry` edge policies; commit-then-timeout duplicates; V4(c) | engine | S-023a | 1 | agent | `components/client`, `policies/` | C (split; adds idempotency key, which no MP ticket owned) |
| S-025c | DB replicas 0-3, apply stream, `replica_lag`, `stale_read_ratio`; V10 lag check | engine | S-025a | 1 | agent | `components/db` | C (split) |
| S-026 | Load balancer: round-robin, random, least-outstanding; health checks; V10 detection window | engine | S-022 | 1 | agent | `components/load-balancer` | = |
| S-027 | Queue and worker: bound, visibility timeout, max receives, DLQ, queue age; V10 duplicates | engine | S-022 | 2 | agent | `components/{queue,worker}` | = |
| S-028 | Rate limiter, CDN, object storage, external dependency, DNS; V10 token bucket and CDN | engine | S-022, S-024 | 2 | agent | `components/` | = |
| S-029 | Circuit breaker (call and retry breakers) | engine | S-023b | 1 | agent | `policies/circuit-breaker` | = |
| S-030b | Scenario injectors: `instance-crash`, `slow-dependency`, `dependency-errors`, `write-burst`, `bad-deploy` (A-M8 property test) | engine | S-030a, S-028, S-025c | 1 | agent | `scenarios/` | C (split; `hot-key` moves to S-031) |
| S-031 | DB partitions with key map and `hot-key` scenario; quorum replication (N, R, W); V10 hot-key, quorum latency and staleness | engine | S-025c, S-030a | 2 | agent | `components/db`, `scenarios/hot-key` | C (adds `hot-key`) |
| S-041 | V4(a) HotOS '25 reproduction, including spike B's question: read the arXiv semantics (gap G2); B1/B2 criteria; L16 label | validation | S-040, S-023b | 2 | agent | `validation/reproductions/hotos25` | C (absorbs S-004) |
| S-042 | V4(b) Brooker 2022 retry strategies | validation | S-040, S-029 | 1 | agent | `validation/reproductions/brooker22` | = |
| S-043 | V5 sensitivity for all built labs; final English limitations statement handed to sdlab | validation | S-041, S-042, S-031 | 1 | human | `validation/sensitivity`, `docs/limitations.md` | = |

### 8.6 S4 Labs per unit and UI modes (M4 order after Unit 0: 1, 2, 6, 3, 4, 5)

| id | Title | Type | Depends on | Est | Rev | Δ |
| --- | --- | --- | --- | --- | --- | --- |
| S-081 | Unit 1 lab support (approved list from S-011) | lab | S-072, S-052 | 1 | agent | = |
| S-082 | Unit 2 lab support | lab | S-072, S-026, S-028, S-023b, S-052 | 2 | agent | C: adds S-023b (idempotency lab) |
| S-083 | Unit 6 lab support | lab | S-072, S-029, S-041, S-030b, S-052 | 2 | agent | C: adds S-030b |
| S-084 | Unit 3 lab support | lab | S-072, S-031, S-052 | 1 | agent | = |
| S-085 | Unit 4 lab support | lab | S-072, S-027, S-052 | 1 | agent | = |
| S-086 | Unit 5 lab support (quorum-limits debrief checked) | lab | S-072, S-031, S-052 | 1 | agent | = |
| S-063 | Sampled animated request flow (≤ 200 tokens; off on mobile if over budget) | ui | S-061 | 1 | agent | = (cut #2) |
| S-064 | Side-by-side compare with common random numbers | ui | S-062, S-050 | 1 | agent | = (cut #6) |
| S-065 | Diagnose mode: two-step grading, two diagnosis tries | ui | S-061, S-030b | 1 | agent | = |
| S-066 | Constrained build mode | ui | S-061 | 2 | agent | = (cut #1) |
| S-067 | i18n and accessibility pass: all strings from `id.yaml`, WCAG AA contrast, keyboard | ui | S-061, S-068 | 1 | agent | = |

Each S-08x only covers engine needs and verification; each lab is authored and calibrated in an sdlab sub-ticket with the pinned CLI (MP 5.5, P-15). Order of pickup follows the M4 order: S-081, S-082, S-083, S-084, S-085, S-086, with UI tickets interleaved when their dependencies are done.

### 8.7 S5 Incidents, QA, release

| id | Title | Type | Depends on | Est | Rev | Δ |
| --- | --- | --- | --- | --- | --- | --- |
| S-090 | Incident mode: `*.lab.yaml` loader, modelability labels, diagnose UX, verify modeled and illustrative incidents | lab | S-065, S-030b, S-052 | 2 | agent | = |
| S-091 | Simulator QA: full regression, mobile perf, V9; SC1-SC5, SC7, SC8 report | validation | S-080 to S-086, S-090, S-043, S-063, S-064, S-066 (or recorded as cut), S-067 | 1 | agent | = |
| S-093 | Deferred 5-user pilot support (SC6): pilot build, local-only timing log, test script | release | S-091 | 1 | human | A (R2) |
| S-092 | SG3: release `sim-v1.0.0` pinned to `content-v1.0` | release | S-091, S-093, `sdlab:P1-064` | owner 1-2 h | none | = |

### 8.8 Order of the first 10 agent tickets

1. **S-001** toolchain and CI (owner does S-009 the same day)
2. **S-003** spike A (2 sessions)
3. **S-010** contract v0.1.0 (2 sessions; parallel track)
4. **S-005** spike C (2 sessions; then the owner does S-008)
5. **S-011** lab matrix (early, because sdlab's Unit 0 production needs OD-5 before it writes the Unit 0 lab)
6. **S-006** spike D
7. **S-002** `sdlab:` dependencies
8. **S-013** `id.yaml` v0
9. **S-020** run control and Worker protocol (after SG0); in parallel **S-060** web shell
10. **S-021** metrics recorder, then **S-022** service node and **S-050** lab runtime

---

## 9. Engineering conventions

`docs/conventions/engineering.md` holds the stable principles; this section is the enforceable detail. If they disagree, fix it in a ticket.

### 9.1 Testing strategy

| Layer | What | Bar | When |
| --- | --- | --- | --- |
| Oracle (V1) | M/M/1 at ρ 0.5/0.8/0.9 (mean, p99 = ln(100)/(μ-λ)); M/M/4 at ρ 0.8 (Erlang C); M/D/1 and M/G/1 cv 0.5/2 (P-K); fan-out max of k exponentials; 3-station tandem (Jackson) | Mean within 5%, p99 within 10%, Erlang C and P-K within 10%, over 10 fixed seeds (MP 7.1) | every PR |
| Invariants (V2) | Little's law per boundary over a run that starts and ends empty; conservation; goodput ≤ throughput; amplification ≥ 1; ratios in [0, 1] | L = λW within 2%, the rest exact | every PR, every lab run in test mode |
| Behavior (V10) | One check per modeled component, tied to its MP R3 source | as MP 7.1 V10 | every PR |
| Reproductions (V4) | HotOS '25, Brooker 2022, backoff/jitter, HotOS '21 §2.2 | MP 7.1 V4 | every engine PR |
| Golden (V6) | Event-log hash per lab and seed (streaming hash over time, event type, node id, request id) on Node and Chromium | unchanged, or updated in the same PR with a CHANGELOG line "behavior change" | every PR |
| Property (V7) | fast-check random topologies within catalog ranges, **fixed fast-check seed** printed on failure | no crash, no NaN, V2 holds | every PR |
| Lab CI (MP 6.4) | baseline, reference, wrong answers, margins, flake, time budget | MP 6.4 | every PR for in-repo fixtures; nightly for sdlab specs (S-053) |
| Sensitivity (V5) | joint rate scaling ×0.5/×2, seed count, bucket size, cv ±25% | verdicts unchanged | before BG1 for the caching lab; before each unit closes |
| Cross-check (V3), cross-browser (V9) | Ciw; Firefox and WebKit via Playwright | MP 7.1 | weekly; before BG2 and G3 |
| Contract conformance | Valid/invalid fixtures, expected errors; the same fixtures run in sdlab's Python validator | identical verdicts | every PR touching `contract/` |
| UI | Playwright at 360 x 800 and 1280 x 800: lab loads, edit, grade, result; quiz flow | pass | every PR touching `apps/web` or `packages/ui` |

Statistical tests never use random seeds in CI. A test that fails on one seed and passes on another is a bug in the model or the test, not noise.

### 9.2 Engine purity (how it is enforced)

- `packages/engine/tsconfig.json` sets `"lib": ["ES2023"]` with no `DOM` and no `WebWorker` lib, so DOM types do not compile. `types: []` keeps Node globals out.
- ESLint in `packages/engine` and `packages/lab-runtime`: `no-restricted-globals` (`Date`, `performance`, `setTimeout`, `setInterval`, `crypto`, `window`, `self`, `document`), `no-restricted-properties` (`Math.random`), `no-restricted-syntax` for `for...in`; `eslint-plugin-boundaries` enforces L0 ← L1 ← L2 ← L3 and blocks UI imports of the engine.
- The Worker entry (`apps/web/src/worker.ts`) is the only file that touches `self.postMessage`; it imports the runtime, not the other way round.
- All randomness through `rng.stream(seed, componentId, purpose)`; streams are derived by hashing the triple, so one component's edit does not reshuffle the others (MP 4.6).
- Wall-clock time appears only in the UI (animation frames) and in perf tests.

### 9.3 Honesty labels (how they are enforced)

- Every catalog entry has `honesty: modeled | illustrative | not-modeled`. `modeled` requires `evidence: [<check ids>]` whose kinds are V1, V3, V4 or V10 (amended S05); `illustrative` requires `assumption: <A-id>` from MP 7.2; registry ids go in `sources`.
- Check ids are test names (`V1.mm1.rho08`, `V10.lb.detection-window`); `contract/build.ts` fails if an evidence id does not match a test in `validation/`.
- The lab runtime refuses specs that use a `not-modeled` id, and reports `illustrative` ids so the UI shows the "ilustratif" badge (text from `id.yaml`) on that node, metric or scenario, plus the spec's `illustrative_note`.
- Upgrading a label from illustrative to modeled is a contract change with new evidence, reviewed by `model-reviewer`.

### 9.4 Performance budgets (tests, not wishes)

| Budget | Value | Source | Measured in |
| --- | --- | --- | --- |
| Engine throughput | ≥ 5 M events/s on Node, reference laptop | MP A4 | S-003, perf test |
| Event budget per seed | ≤ 5 M events; the run stops with `budget_exceeded` | MP 4.2 | engine, lab CI |
| Grading, heaviest lab, 5 seeds | ≤ 5 s desktop Chrome on the reference laptop, ≤ 15 s at 4× CPU throttle | MP SC5/A5 | Playwright perf test |
| Grading, caching lab, owner's phone | ≤ 5 s with a progress bar | this plan (BG1) | S-071 |
| Snapshot cost | ≤ 4 ms main-thread time per 10 Hz frame | MP A6 | S-003, S-062 |
| Lab page JS | ≤ 300 KB gzip | MP C3 | size-limit in CI |
| Rates in labs | ≤ 500 simulated requests/s | MP 4.2 | contract ranges |

### 9.5 Error handling

- Spec errors (schema, catalog, ranges) are collected and returned as a list of `{rule, path, message}`; never thrown one by one, never a stack trace (HANDOFF §7).
- Engine invariant violations throw a typed `SimInvariantError` in tests and dev builds; in production builds the run ends with a `failed` result and the UI shows a generic Indonesian message from `id.yaml`. Values are never silently clamped.
- The Worker always answers a request with `result` or `error`; the UI has a timeout and a retry button.
- Quiz and content bundle: a malformed item is skipped with a console warning in dev; the bundle build fails in CI.

### 9.6 Versioning, freeze and change protocol

- Contract: semver; 0.x until S-072. A minor only adds ids, parameters or wider ranges. A major removes or renames an id, narrows a range, or changes a metric definition, a default, or engine behavior that alters any lab verdict (MP 5.2 amendments). S02 enforces majors from 1.0.0 on.
- Engine: `sim-vX.Y.Z`; replay identity = (engine version, contract version, spec hash, seed, edit list).
- Freeze points: MP 5.4, with R9 (1.0.0 after BG2). After G3 only fixes; outcome-changing model changes go to v1.1.
- Change protocol for a contract change: (1) ticket in this repo with the reason; (2) PR updates `catalog.yaml`/schema, `CHANGELOG.md`, fixtures and evidence; (3) S01/S02/S05/S06 and drift pass; (4) a major needs `review: human` and a migration ticket proposal for sdlab; (5) release tag; (6) sdlab bump ticket vendors it and runs `validate.py`.
- Requests from sdlab (a field the format needs) arrive as an sdlab ticket note or a ticket here; the schema change happens here first, then sdlab adopts it.

### 9.7 Definition of done (every agent ticket)

- [ ] All done criteria of the ticket are met and ticked honestly.
- [ ] `python scripts/validate.py` passes; `npm run lint`, `npm run typecheck`, `npm test` pass; CI green.
- [ ] New or changed behavior has tests at the right level (oracle, V10, property, golden, e2e); tolerances stated in the test.
- [ ] Model semantics changed → `docs/model/<id>.md` updated and `model-reviewer` passed.
- [ ] Contract changed → CHANGELOG entry, semver check, fixtures, evidence/assumption ids.
- [ ] Golden hash changed → CHANGELOG line "behavior change" with the reason.
- [ ] No learner-facing text in code; new strings are `id.yaml` keys.
- [ ] Perf budgets that the ticket touches are measured and recorded.
- [ ] A reviewer subagent that did not do the work reviewed the changed files against the done criteria; findings fixed.
- [ ] Session log, ticket Notes, `board.py`, PR `[<ID>] <title>`.

---

## 10. Cross-repo workflow with sdlab

### 10.1 Who owns what

| Thing | Owner | Where |
| --- | --- | --- |
| Concepts, which concepts want a lab | sdlab | `curriculum/concepts.yaml` |
| What can be modeled, ranges, honesty | sdsim | `contract/catalog.yaml` |
| Lab-spec structure (JSON Schema) | sdsim from contract v0 on; until vendored, sdlab's `validate.py` is the de facto rule and S-010 must accept what it accepts | `contract/lab-spec.schema.json` |
| Lab specs and all lab text (Indonesian) | sdlab | `content/concepts/<id>/lab.yaml`, `content/incidents/<id>.lab.yaml` |
| UI chrome, component and metric labels | sdsim (reviewed by sdlab `content-reviewer`) | `contract/i18n/id.yaml` |
| Lab calibration (numbers in specs) | sdlab agents, with the pinned CLI | sdlab sub-tickets |
| Limitations page (Indonesian) | sdlab, from S-043's English draft | `content/simulator/limitations.md` |

sdsim agents never edit sdlab; they propose (MP 10.2 rule 6).

### 10.2 How a contract change flows

1. sdsim ticket → PR → release `contract-vX.Y.Z` (and `sim-vX.Y.Z` if the engine changed).
2. sdlab bump ticket: copy the release files into `contracts/sim/`, update `VERSION` (version, sha256, sim release and commit), run `validate.py` and the pinned lab CI, fix specs if needed.
3. sdsim's nightly drift (S-053) reads sdlab `main` and warns (S04) when the pin is more than one minor behind.

### 10.3 What breaks when

| Event | What fails | Who fixes |
| --- | --- | --- |
| sdsim minor release | Nothing until sdlab bumps; S04 warns after one minor | sdlab bump ticket |
| sdsim major release | sdlab C02 on bump | sdlab migration ticket; owner approved the major |
| Engine change alters a verdict for an existing sdlab lab | Drift (S-053) on the sdsim PR | sdsim: fix, or declare a behavior change (major) and propose recalibration |
| New or edited sdlab lab spec is invalid or fails lab CI | sdlab CI (C01-C05 + pinned `lab-ci`) | sdlab; sdsim nightly drift notes it but does not block sdsim PRs (MP 5.5) |
| sdlab wants a new field or parameter | sdlab `validate.py` rejects it (unknown fields are errors) | sdsim contract change first, then sdlab |
| sdlab content changes (lessons, questions) | Nothing in the deployed app until `apps/web/content.lock` is bumped | sdsim bump PR (rebuilds the bundle) |

### 10.4 Tickets sdlab needs (proposals; created by sdlab sessions, not here)

| Proposal | Content | Needed by |
| --- | --- | --- |
| P-12 (MP 5.6) | `validate.py` and `board.py` accept `sdsim:` dependencies (MP wrote `stud-sim:`), read from `backlog/external.yaml`, with fixture tests | before any `sdsim:` edge in sdlab |
| P-05/P-13 (MP 5.6) | Vendor `contracts/sim/`, implement C01-C04, C10, C11 with fixture tests, add `jsonschema` 4.26.0, add the pinned `lab-ci` step to sdlab CI; update content-schema §5 "Not yet specified" from the contract | S-080 |
| OD-5 follow-up | Edit `concepts.yaml` `formats` per the approved lab matrix (S-011) | before the Unit 0 lab is written |
| Unit 0 lab | A P1-048 sub-ticket writes and calibrates the Unit 0 lab spec | S-080 |
| P-16 | Migrate `caching-basics/lab.yaml` from 0.1.0 to 1.0.0 | after S-072 |
| R10 | Fix the `restart-herd` example in content-schema §6 | when P-05 runs |
| ADR 0007 | Its "Open: where the code lives" line is stale (sdsim exists, ADR 0002 here) | any sdlab docs ticket |
| P-10 | P1-064 (G3) done criteria add "all labs pass the pinned simulator lab CI" | before G3 |

---

## 11. Risks

| # | Risk | Likelihood / impact | Earliest signal | Mitigation | Fallback |
| --- | --- | --- | --- | --- | --- |
| K4' | **Slice overrun.** 33 sessions before the owner can use a lab; holidays fall inside | high / medium | I0 not reached by agent session 16 | Two parallel tracks (OD-9); I0 checkpoint; cut list in 7.3 | Move BG1; never ship a lab whose lab CI fails |
| K1+K9 | **A false mechanism, or agent-written model bugs that pass the agent's own tests** | medium / high | V1/V4 failures; model-reviewer findings; golden hash churn without a reason | Oracle tests written before each component; emergent-only rule; reviewer never the author; external reproductions (V4); evidence ids enforced by build | Label the behavior `illustrative` or remove it from the catalog; the lab waits |
| K15 (new) | **Lab list vs modelability.** 25 concepts list `lab`; at least 4 need not-modeled behavior; pressure to fake them | high / high | S-011 matrix | OD-4 decided before sdlab writes those specs; C05 rejects not-modeled ids | Concept stays quiz-only |
| K6 | **Mobile performance or usability fails** | medium / high | Spike A5/C; I0 on the owner's phone | Worker per seed, event budgets, small bundle, SVG | Precomputed parameter grids (static JSON); chart-first layout without topology |
| K3+K16 (new) | **Contract churn between two repos** while sdlab produces Unit 0 in parallel; PyYAML vs `yaml` dialect differences | medium / high | Drift failures; conformance fixture mismatches | Conformance fixtures run on both sides; freeze after two real labs (R9); one change protocol | Hold sdlab lab writing for a unit until its catalog part is released |
| K2 | **False precision** (ms and RPS read as real numbers) | medium / high | Owner or reviewer reads a number as a fact | "ilustratif" badges from the catalog; limitations page; threshold grading | More prominent labels; hide absolute axes behind a toggle |
| K17 (new) | **Owner bottleneck and missing remote.** Gates, phone measurements and merges wait on one person; no GitHub remote means no PR flow | medium / medium | S-001 PR cannot be opened; SG0 not held within 3 days of spikes ending | Owner list (section 13); agents prepare one-page decision summaries; owner tickets are small | Agents continue on unblocked tickets on local branches; nothing merges without the owner |
| K18 (new) | **Toolchain churn.** Several chosen tools had new majors in 2026 (TS 7, Vite 8, Vitest 5, ESLint 10); incompatibilities appear mid-project | medium / low | `npm ci` or lint breaks after an update | Exact pins; lockfile; updates only in dedicated tickets; TS 6 until typescript-eslint supports 7 | Stay on the pinned versions through G3 |

Also tracked from MP 11.1, lower ranked here: K5 scope creep (now also from the beta app: accounts and progress stay Phase 3), K7 metastable result not reproducible (decides L16's label only), K8 licenses (all chosen tools MIT/ISC/Apache-2.0, checked above), K10 flaky grading (MP 6.4 margins and flake check), K11 cross-browser numerics (statistical grading), K13 labs too hard (owner beta, then the 5-user pilot), K14 hosting terms (static build is portable).

### 11.1 Assumptions the owner must confirm

1. Capacity: 5 sessions a week on one track, or about 8 on two tracks until BG1 (OD-9).
2. This Fedora machine is the reference laptop for A4/A5 and SC5 (owner records the model and CPU in S-008).
3. The owner's own phone is the test phone (MP Q7); its model is recorded in S-008.
4. The beta app (quiz, lesson pages) lives in `sdsim/apps/web` (OD-3).
5. Public repo, MIT code license, GitHub Pages (OD-1, OD-2).
6. The toolchain in 5.3, in particular React and TypeScript 6.0.3.
7. Contract 1.0.0 freezes after the Unit 0 lab, not after the caching lab (R9).
8. The Unit 0 lab scope in OD-5 (threads and pool only; CPU, memory and disk in the lesson and quiz).
9. D8 and D11 (seeded determinism; rule-based grading, no LLM).
10. Progress in the beta lives only in the browser; clearing site data loses it.

---

## 12. First two weeks

Dates assume approval on 2026-11-17 and count working days. Two agent tracks run side by side (OD-9); with one track, run the same tickets in the order of section 8.8.

| Day | Owner | Track A | Track B |
| --- | --- | --- | --- |
| 1 (11-17) | Approve this plan; S-009: create `Alfthrpy/sdsim` (public), choose license, enable Pages; answer OD-9 | **S-001** toolchain and CI (`review: human`; owner merges) | — |
| 2 | Merge S-001 | **S-003** spike A, session 1: heap, clock, RNG streams, M/M/1 and M/M/4 oracles, golden hash on Node | **S-010** contract v0, session 1: catalog for the caching lab's ids and the 12 components; schema from content-schema §5 |
| 3 | — | **S-003** session 2: M/G/1, tandem, Worker bridge, A3 in Chromium via Playwright, A4/A5/A6 measurements, `docs/spikes/A.md` | **S-010** session 2: fixtures (real caching lab, sdlab test fixtures, YAML dialect cases), S01/S02/S05/S06, `build.ts` |
| 4 | — | **S-006** spike D | **S-005** spike C, session 1: SVG and React Flow prototypes at 360 px |
| 5 | — | **S-002** `sdlab:` dependencies | **S-005** session 2: bottom sheet, uPlot, C1/C3/C4 measured; prototype reachable from the phone (Pages preview or LAN) |
| 6 | S-008: phone trial (C2), laptop and phone models | **S-011** lab matrix (`review: human`) | **S-013** `id.yaml` v0 |
| 7 | **S-007 SG0** (about 1 hour, from the one-page summary the agent prepares in S-006/S-005 Notes); decide OD-4/OD-5 from S-011 | — | — |
| 8 | — | **S-020** run control and Worker protocol | **S-060** web shell, session 1 |
| 9 | — | **S-021** metrics recorder | **S-060** session 2: Pages deploy, Playwright smoke |
| 10 | — | **S-022** service node, session 1 | **S-050** lab runtime, session 1 (then S-061; S-062 with the I0 page follows S-022 on day 11-12, and the owner opens I0 on the phone) |

If SG0 is NO-GO (A1-A3 fail and no fallback works), stop after day 7 and revise this plan (MP 9: precomputed, chart-only labs). If spike D recommends adopting an engine, S-020 to S-025a are re-estimated before they start.

---

## 13. What the owner must do

1. **Today:** approve or amend this plan; create the GitHub remote for `sdsim` (public recommended), pick the code license, enable GitHub Pages (OD-1, OD-2); say how many agent sessions a week and whether two tracks run in parallel (OD-9).
2. **Day 1-2:** review and merge S-001 (toolchain; `review: human`).
3. **About day 6:** S-008: record the reference laptop model and CPU (this machine, unless you name another), your phone model, and try the spike C prototype on your phone (C2: finish the caching tune task without pinch-zoom).
4. **About day 7:** SG0 (S-007): go/no-go, canvas choice, build vs adopt, confirm D8 and D11. Decide the lab list and the Unit 0 lab scope from S-011 (OD-4, OD-5), and whether the beta has lesson pages (OD-10) and lives in `sdsim` (OD-3).
5. **In sdlab:** let sdlab sessions create P-12 and P-05 (section 10.4) and apply the `formats` edits from the lab matrix before the Unit 0 lab is written.
6. **BG1 (S-071):** use the caching lab and the quiz on your phone; write down what confused you and how long it took.
7. **BG2:** approve the contract 1.0.0 freeze (S-072); try the Unit 0 lab.
8. **Before any public beta:** run the deferred 5-user pilot (S-093); decide the product name, content license and public reviewer (sdlab P1-003).
9. **Ongoing:** about 30 minutes a week to skim merged PRs; review the `review: human` tickets (S-001, S-011, S-043, S-072, S-093).
