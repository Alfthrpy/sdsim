# ADR 0002 — The simulator lives in its own repository, `sdsim`

- **Status:** accepted
- **Date:** 2026-11-16

## Context

The STUD Simulator Master Plan (Claude Docs, 2026-11-13) puts the simulator in a repository separate from the content repository `sdlab` ("2 repos, 4 layers, 1 contract"), because the two change at different speeds and for different reasons: content changes with the curriculum, the simulator changes with the catalog of what can be modelled honestly. On 2026-11-16 the owner created the folder for it as `sdsim`; the plan calls the repo `stud-sim`.

## Decision

- The repository is `sdsim`. Where the master plan says `stud-sim`, read `sdsim`.
- `sdsim` owns the contract (catalog, JSON Schema, i18n, semver), the engine, the lab runtime, grading and the UI. `sdlab` owns concepts, lab specs and learner-facing text, and vendors a released contract into `contracts/sim/` and checks its lab specs against it.
- The first slice is a running caching lab for the owner (the only beta tester for now); breadth follows in the order of the master plan.
- Where the code is hosted (GitHub remote, Render) is the owner's decision and is not assumed here.

## Consequences

- Contract changes are the main coordination point between the repositories; see `docs/PLAN.md`.
- Lab spec format decisions made in `sdlab` (`docs/conventions/content-schema.md` section 5) bind the contract: the schema and catalog produced here must accept those specs, and deviations are fed back into the master plan.
