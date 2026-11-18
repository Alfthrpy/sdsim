---
id: S-022
title: "Service node and api-server"
milestone: S2
type: engine
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-020, S-015]
estimate: 2
outputs:
  - packages/components/service
  - packages/components/api-server
  - docs/model/api-server.md
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-022. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Slots, gamma service, queue bound, FIFO/LIFO, concurrency limit, fan-out; sync-call slot holding; downstream calls in edge order (ADR 0003 #4); V1 oracles.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
