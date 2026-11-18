---
id: S-010
title: "Contract schema v0 and conformance fixtures"
milestone: S1
type: contract
owner: agent
review: agent
status: in-progress
priority: high
depends_on: [S-001, S-103]
estimate: 1
outputs:
  - contract/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.2, ticket S-010. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

JSON Schema matching content-schema §5 with keys/skew under traffic (R24); component descriptor format (parameters, units, ranges, defaults, metrics, honesty, evidence); predicate argument shapes, scenario fields, metric ids and units; conformance fixtures incl. the real caching lab and YAML-dialect cases. Must accept R6/R7. Also the scenario and play fields from `docs/design/lab-flow.md` section 5 (`scenario.story`, `scenario.symptom`, `scenario.timeline[]`, `scenario.observe[]`, `play.speeds`) and the metric `node_status`, once S-103 is approved.

## Done criteria

- [x] `contract/lab-spec.schema.json` accepts the real `caching-basics` lab with `keys` and `skew` under `traffic`
- [x] Every structural case from sdlab's `tests/test_labs.py` gets the same verdict from the schema (109 of 143 cases give the same verdict as sdlab's own validator, run by `contract/scripts/check_against_sdlab.py`; the other 34 are listed under `differs`: 2 new fields, 32 where the schema is stricter or sdlab is lenient. Same verdict is not always the same rule)
- [x] The component descriptor format, predicate argument shapes, scenario fields and metric units are defined (metric ids are a pattern in 0.1.0; S-010b generates the enumeration)
- [x] YAML dialect cases: the TypeScript loader reads 65 of 76 snippets like PyYAML; the 11 that differ are listed with reasons and checked to still differ
- [x] The scenario and play fields from S-103 are in the schema (named `case` and `play`)
- [x] `python scripts/validate.py` passes; lint, typecheck and tests pass
- [x] Independent review (code-reviewer) done and findings fixed (see Notes)
- [ ] CI green

## Notes

- Review (code-reviewer, pass with fixes). Fixed: the schema accepted non-numeric edit values that sdlab rejects (now numeric in tune and diagnose); no upper bounds (limits added); descriptor rules for `not-modeled` and defaults by kind; the loader now matches PyYAML on `y`/`n`, exponents, signed floats and leading-zero integers, and rejects a `%YAML` directive (the first version turned `yes` into false in a `%YAML 1.2` document); 24 more dialect snippets and a self-checking list of the 11 remaining differences; 39 more cases (numeric edits, limits, sdlab leniencies, `case` fields); `tune-with-empty-allowed-edits` was wrongly listed as a difference; numbers corrected; `lab-flow.md` renamed to `case`; RULES, CHANGELOG and README completed. Not done: `node_status` (a derived series: S-010b), enforcing the R24 move (needs per-type parameter checks: S-010b), `check_against_sdlab.py` in CI (belongs to the drift check S-012, which will check out the public sdlab repo), a `rule` id on problems (PLAN 9.5; added with the CLI).
- The schema checks structure only. Cross-field rules (references, ordering, windows, min and max, duplicate ids, anti-leak) stay validator rules; `contract/RULES.md` says which check lives where.
- Found by testing, not assumed: `yaml` in 1.1 mode differs from PyYAML on `y` and `n` (booleans in `yaml`, strings in PyYAML) and on exponents without a dot and a sign (`1e3`); both are patched in `contract/src/yaml.ts`. `=` and `<<` as plain values make PyYAML fail and are strings here (documented, tested). My own fixture used `no` as text and was read as `false`, which is the trap this guards against.
- The owner's S-103 design called the narrative field `scenario`; it is `case`, because `scenarios` already names the hidden catalog scenarios of diagnose mode.
- Six predicate argument shapes (`has-node`, `has-edge`, `node-between`, `count-le`, `policy-present`, `no-spof`) and the edge `policies` shape are proposals: no real lab uses them yet. Build-mode solutions are not specified.
- `sdlab` follow-ups are listed in `contract/CHANGELOG.md`; this repo does not edit `sdlab`.
- Dependencies added: `ajv` 8.20.0 and `yaml` 2.9.1 (PLAN 5.3), exact. `json-schema-to-typescript` is not added yet (the generated spec types arrive with S-010b).
