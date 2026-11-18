---
id: S-010b
title: "Generated catalog and first release (contract-v0.1.0)"
milestone: S2
type: contract
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-010, S-022, S-023a, S-024, S-025a]
estimate: 1
outputs:
  - contract/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-010b. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

contract/build.ts builds catalog.json from curated descriptors (committed), changelog, checks S01, S02, S05, S06; tag contract-v0.1.0.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
