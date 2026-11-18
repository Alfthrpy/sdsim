---
id: S-052
title: "Simulator CLI release tarball and npx check"
milestone: S2
type: release
owner: agent
review: agent
status: todo
priority: medium
depends_on: [S-051, S-012]
estimate: 1
outputs:
  - .github/workflows/release.yml
  - packages/cli
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.3, ticket S-052. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

sim-v* release tarball, conformance fixtures shipped; verify npx from a release URL.

## Done criteria

- [ ] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
