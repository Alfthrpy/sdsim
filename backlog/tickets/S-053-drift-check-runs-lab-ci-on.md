---
id: S-053
title: "Drift check runs lab CI on sdlab specs"
milestone: S1
type: validation
owner: agent
review: agent
status: todo
priority: medium
depends_on: [S-012, S-051]
estimate: 1
outputs:
  - .github/workflows/drift.yml
  - packages/cli
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.2, ticket S-053. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

MP 6.4 lab CI on every sdlab spec (S03, S04) against the last green sdlab commit.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
