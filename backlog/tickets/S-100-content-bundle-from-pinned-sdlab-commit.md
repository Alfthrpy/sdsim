---
id: S-100
title: "Content bundle from pinned sdlab commit"
milestone: S2
type: ui
owner: agent
review: agent
status: todo
priority: medium
depends_on: [S-060, S-002]
estimate: 1
outputs:
  - apps/web/scripts/bundle.ts
  - apps/web/content.lock
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-100. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Read a pinned sdlab commit (lessons, questions, lab specs), emit JSON for apps/web; lock file with the commit.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
