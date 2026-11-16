# Context handoff

Written 2026-11-16 by the agent session that finished the sdlab-side lab format and scaffolded this repo. Read this once at the start of a session, after `AGENTS.md`. It is a snapshot: where it names a file or a pull request, check the current state before relying on it.

## 1. What this project is

A free, Indonesian-language platform for learning **backend system design**: short lessons, quizzes, simulation labs and real incidents, for students, junior engineers and solo developers. Three equal goals: understand production-scale systems, learn new things, prepare for interviews (sdlab ADR 0004). Growth ladder: single-server backend first (Unit 0), then each distributed-systems idea as what you reach for when the previous stage stops being enough (Units 1-6).

Two repositories, side by side in `stud-new-gen/`:

| Repo | Folder | Holds |
| --- | --- | --- |
| content | `../sdlab` | sources registry, curriculum (50 concepts), lessons, questions, lab specs, incidents, case studies |
| simulator (this repo) | `../sdsim` | contract (catalog, JSON Schema, i18n), engine, lab runtime, grading, UI |

## 2. The owner and how to work with them

- Chats in Indonesian, short and direct. Report in 3-5 lines: what is done, what they must do, what is next.
- Agile, "serious" about the stack: the product is meant to keep running, not a throwaway prototype. The only hard product constraint is **usable on mobile**; free hosting only (a Render free plan is acceptable, simulation stays client-side).
- The owner is the **only beta tester for now** (sdlab ADR 0007). Do not plan around recruiting testers. Unit 0 ships first; the next goal is a running quiz and lab.
- They usually merge PRs themselves and say so. Never merge `review: human` PRs. Never create repositories, remotes, accounts or deployments without an explicit go-ahead (AGENTS.md rule 9).
- Style rule they gave: learner-facing text must not narrate provenance ("menurut sumber", "penalaran penulis"). Honesty is carried by labels and structure.
- Tool quirks: WebFetch returns model-written summaries, so re-check exact strings; a transient auto-mode classifier failure can be retried once.

## 3. State of the world

**sdlab (content)**, as of 2026-11-16:

- Done: reference registry (about 198 sources, all `approved` except one rejected wiki), curriculum v1 (50 concepts, 84 prerequisite edges, tagged `curriculum-v1`), 12 case studies and 12 incident candidates, content schema and validator, style guide and anti-leak heuristics, the lab and incident format.
- Pilot: `caching-basics` (lesson, 10 questions, 6 misconceptions, a lab spec) written and reviewed twice by independent agents; the owner read it and was satisfied.
- Open pull requests at the time of writing (verify with `gh pr list` in `../sdlab`): #44 pilot content, #45 ADR 0007, #46 lab and incident spec format (stacked on #44). Until #44 and #46 are merged, `main` of sdlab has neither the lab format nor the first lab.
- Not done: Unit 0 content production (8 concepts, one lab: "limits of one machine"), the other units, `contracts/sim/` (nothing is vendored yet), the sdlab-side catalog checks (C01-C04, C10, C11) because there is no catalog yet.
- 24 concepts list `lab` in their formats but have no lab spec; the master plan targets 16 labs for v1.

**sdsim (this repo)**: scaffold only: docs, ticket tooling (Python), CI for tickets, reviewer subagents. No code, no toolchain, no git remote. The development plan is `docs/PLAN.md` (600 lines, written by a planning subagent in the same session and not yet reviewed by the owner: read it, check it against the master plan, and treat its open decisions OD-1 to OD-10 as the owner's). Its headline numbers: about 75 agent sessions for the full v1 against 67 in the master plan; the owner's caching beta (quiz, lab and a phone-usable app) is 33 sessions plus 4 owner tickets; the first ten agent tickets are S-001 toolchain and CI, S-003 spike A, S-010 contract v0.1.0, S-005 spike C, S-011 lab matrix, S-006 spike D, S-002, S-013, S-020 with S-060, then S-021, S-022 and S-050. Section 4 of the plan lists 22 deliberate differences from the master plan (R1-R22); read it before changing any of them.

## 4. The master plan

The technical source of truth is the Claude Docs document **STUD Simulator Master Plan** (2026-11-13), id `N2A8SMG1i6FVucdY5qNec4`, link `https://claude.ai/artifact/N2A8SMG1i6FVucdY5qNec4`. Read it with the Claude Docs tools (`guide` topic.index, then `read` the doc, then its body node `eeaaa037-52b4` with `projection: outline` and `kind: view, parentId: mf2wpjc0pqn.<n>` for blocks). Never web-fetch it. A sibling document, "Rencana Induk: Platform Belajar Backend System Design (Gratis)" (id `Qa4FJpMQPK2o1vxUqh9EuC`), is the older overall master plan.

Sections and the block ids worth knowing (prefix `mf2wpjc0pqn.`): decisions D1-D12 `.880`; research R1-R8 `.6619`-`.21096`; layers `.24899`; components `.27384`; scenarios `.29404`; metrics `.75568`; determinism `.31415`; contract and validation rules `.32438`, `.34152`, `.78940`; lab spec table `.39285` with the example `.81790`; grading `.42575`; anti-leak `.43507`; incidents `.45549`/`.45784`; checks `.47055`; milestones `.52103`; spikes `.54582`; repo bootstrap and the draft ticket table `.57902`-`.88405`.

Decisions in force (summary; the document is authoritative):

| # | Decision |
| --- | --- |
| D1 | Concept-teaching is the primary purpose of the simulator; incident diagnosis and interview practice are secondary formats |
| D2 | v1 modes: **tune**, **diagnose and fix**, **constrained build**; no free-form canvas |
| D3 | Right shape, illustrative numbers; grading uses relative behavior and thresholds |
| D4 | Labs for Units 1-2, 3-5 and 6, plus one Unit 0 lab; Unit 5 labs only where honest |
| D5 | `sdlab` agents write lab and incident specs against a catalog owned by the simulator repo |
| D6 | Usable on mobile is the only hard constraint |
| D7 | A server is allowed only if the owner's Render free plan can carry it; simulation runs client-side |
| D8 | Seeded RNG and fixed-seed replay are an engineering choice (assumed, unconfirmed) |
| D9 | A running caching lab at G2; all v1 labs by G3 (about week 24) |
| D10 | Extras: animated request flow, side-by-side before/after compare |
| D11 | Rule-based grading, no LLM (assumed, unconfirmed) |
| D12 | Plan format: Claude Docs |

**Overrides from the owner (sdlab ADR 0007, 2026-11-16)** where the master plan differs: G2 (a running caching lab piloted with 5 users, week 9) becomes "a running caching lab the owner tests alone"; the 5-user pilot moves to before any public beta. Unit 0 and its lab ship first.

**Name mismatch**: the plan says `stud-sim`, the folder and repo are `sdsim` (ADR 0002 here).

## 5. The lab spec contract from the sdlab side

The format is fixed in `../sdlab/docs/conventions/content-schema.md` sections 5-7 (once #46 is merged; until then read the branch `t/P1-033-lab-incident-spec-format`). The real example is `../sdlab/content/concepts/caching-basics/lab.yaml`: a `tune` lab with nodes `users`, `app`, `cache`, `db`, two allowed edits (`cache.capacity_pct`, `cache.ttl_s`), two targets (`db` utilization at most 0.6, error rate at most 0.01 over seconds 180-600), two structural rules, three hint tiers, a reference solution, two wrong answers (one `brute_force: true`).

The contract produced here must accept those specs. Things to feed back into the master plan, found while writing the format:

- `brute_force: true` on a wrong answer, and `feedback_pass`/`feedback_fail` on structural rules: both required by the sdlab validator; the plan's example omits both.
- The sdlab validator cannot yet check catalog ids, parameter ranges, `contract_version` compatibility, `sim_scenarios` ids or the catalog checksum; these wait for `contracts/sim/` (rules C01-C04, C10, C11 in the plan).
- Not yet specified: the argument shapes of most structural predicates, edge `policies`, scenario fields beyond `id` and `at_s`, valid metric ids and units (utilization is a fraction 0-1 in the pilot), the solution shape of a `build` lab, and what `capacity_pct` means. The catalog must define them.
- The pilot lab does not make a longer TTL costly, so it cannot yet teach the staleness trade-off; objective 1 (cache-aside vs write-through) needs a second lab with a write path.

## 6. What is next

1. Owner decisions that block starting (confirm in `docs/PLAN.md`): where the GitHub remote lives, the license, toolchain confirmation, whether a Render account is wanted.
2. The first tickets (bootstrap, then spikes A engine speed and determinism, B metastable reproduction, C mobile UI, D build-vs-adopt). The spike pass criteria include numbers measured on the owner's reference laptop and phone; an agent cannot produce those.
3. In parallel, `sdlab` continues with Unit 0 content, which feeds the first labs.

## 7. House rules learned in sdlab (worth keeping)

- Every ticket gets an independent review by an agent that did not do the work; in sdlab every review round found real defects (an inverted claim, leaky questions, crashes on malformed input). Budget for two rounds.
- Validators must turn malformed input into error lines, never tracebacks; test with wrong-typed fields.
- When stacking branches (a branch that needs another open PR), say so in the PR body and merge in order; `backlog/BOARD.md` is generated, so resolve its conflicts by regenerating it.
- Ticket ids: do not reuse an id that exists on another open branch; check `gh pr list` and the branches before `new_ticket.py`.
- Commit messages end with the attribution trailer the harness gives; PR bodies end with the Claude Code line.
