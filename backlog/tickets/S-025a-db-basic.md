---
id: S-025a
title: "DB basic"
milestone: S2
type: engine
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-022]
estimate: 1
outputs:
  - packages/components/db
  - docs/model/db.md
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-025a. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Pool as slots, read_ms/write_ms, write commit point (MP 4.2).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
