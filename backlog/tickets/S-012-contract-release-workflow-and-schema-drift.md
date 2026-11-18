---
id: S-012
title: "Contract release workflow and schema drift check"
milestone: S1
type: infra
owner: agent
review: agent
status: todo
priority: medium
depends_on: [S-010b, S-009]
estimate: 1
outputs:
  - .github/workflows/release.yml
  - .github/workflows/drift.yml
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.2, ticket S-012. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

release.yml (contract-v* tags) and nightly schema-level drift check (C01-C05 against sdlab main).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
