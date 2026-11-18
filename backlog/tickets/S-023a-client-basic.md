---
id: S-023a
title: "Client basic"
milestone: S2
type: engine
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-022]
estimate: 1
outputs:
  - packages/components/client
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-023a. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

Rate schedule, open-loop Poisson, read/write mix, per-attempt timeout, censored latency; each request carries a key from a seeded Zipf stream (traffic.keys, traffic.skew, R24).

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
