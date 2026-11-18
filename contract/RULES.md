# Which check lives where

The rule ids follow the master plan (C01 to C13, S01 to S06). "Schema" means `lab-spec.schema.json` or `descriptor.schema.json`; the verdicts are exercised by `fixtures/cases.yaml`.

| Check | Where | Notes |
| --- | --- | --- |
| C01 structure of the spec: required fields, types, enums, patterns, unknown fields, mode-dependent fields (`allowed_edits` / `scenarios` / `palette`), three hint tiers, brute-force entry or waiver, predicate argument shapes | schema | 109 of the 143 cases give the same verdict as sdlab's validator; the other 34 are listed under `differs` (2 new fields sdlab does not know, 32 places where the schema is stricter or sdlab is lenient). Same verdict is not always the same rule: sdlab sometimes fails through a chain of other errors |
| C02 contract version of the spec against the released contract | validator (`contracts/sim/VERSION`) | the schema only checks that `contract_version` is a semver string |
| C03 component, policy, scenario, metric and predicate ids exist | catalog (S-010b) | the schema accepts any kebab-case type and snake_case metric id |
| C04 node parameters and edit ranges inside the catalog ranges | catalog (S-010b) | |
| C05 `illustrative: true` needs a note; used illustrative ids need `illustrative: true` | schema for the note; catalog for the second half | |
| C06 concept exists and lists `lab` | sdlab | needs `curriculum/concepts.yaml` |
| C07 every grading rule has Indonesian pass and fail feedback | schema (present and non-empty); sdlab (language) | |
| C08 anti-leak: no reference value in the goal or tier 1 and 2 hints | sdlab | text analysis |
| C09 reference solution passes its structural rules; wrong answers exist | sdlab now; the simulator's lab CI later | |
| C10 an incident's `sim_scenarios` exist in the catalog | catalog | |
| C11 catalog checksum | release tooling | |
| C12 a latency target is paired with an `error_rate` or `goodput_rps` target | validator | cross-field |
| C13 edits, edges, targets and rules refer to nodes and parameters that exist; `min <= max` (allowed edits and `param-range` arguments); windows `from_s < to_s`; traffic sorted by `at_s`; ids unique (nodes, rules and targets, palette types, sources); one hint per tier; `case.observe` and edge ends refer to existing nodes; `case.timeline` sorted by `at_s`; `play.default_speed` is one of `play.speeds`; no self-loop edge | validator | cross-field; JSON Schema cannot compare two values of the same document. Several of these are not checked by sdlab today either |

Not in 0.1.0: the solution shape of a `build` lab (the schema accepts edits for every mode; build mode is not in the beta), enumerations of metric ids and units for labs (S-010b generates them from the descriptors), and per-type parameter checking of node `params` (C04, S-010b).

Limits chosen in 0.1.0 (widening one is a minor change, narrowing a major): `traffic.schedule[].rate` at most 500 (PLAN 9.4), `traffic.keys` at most 1,000,000, `traffic.skew` at most 3, `duration_min` at most 120, every time (`at_s`, `duration_s`, window ends, caption times) at most 3600 s.
