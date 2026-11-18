# Which check lives where

The rule ids follow the master plan (C01 to C13, S01 to S06). "Schema" means `lab-spec.schema.json` or `descriptor.schema.json`; the verdicts are exercised by `fixtures/cases.yaml`.

| Check | Where | Notes |
| --- | --- | --- |
| C01 structure of the spec: required fields, types, enums, patterns, unknown fields, mode-dependent fields (`allowed_edits` / `scenarios` / `palette`), three hint tiers, brute-force entry or waiver, predicate argument shapes | schema | 91 of the 104 cases agree exactly with sdlab's validator; the rest are listed under `differs` |
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
| C13 edits, edges, targets and rules refer to nodes and parameters that exist; `min <= max`; windows `from_s < to_s`; traffic sorted by `at_s`; ids unique | validator | cross-field; JSON Schema cannot compare two values of the same document |

Not in 0.1.0: the solution shape of a `build` lab (the schema accepts edits for every mode; build mode is not in the beta), enumerations of metric ids and units for labs (S-010b generates them from the descriptors), and per-type parameter checking of node `params` (C04, S-010b).
