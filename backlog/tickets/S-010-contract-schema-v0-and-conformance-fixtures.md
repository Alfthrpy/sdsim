---
id: S-010
title: "Contract schema v0 and conformance fixtures"
milestone: S1
type: contract
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-001]
estimate: 1
outputs:
  - contract/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.2, ticket S-010. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

JSON Schema matching content-schema §5 with keys/skew under traffic (R24); component descriptor format (parameters, units, ranges, defaults, metrics, honesty, evidence); predicate argument shapes, scenario fields, metric ids and units; conformance fixtures incl. the real caching lab and YAML-dialect cases. Must accept R6/R7.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
