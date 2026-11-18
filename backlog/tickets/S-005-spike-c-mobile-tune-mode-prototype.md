---
id: S-005
title: "Spike C: mobile tune-mode prototype"
milestone: S0
type: spike
owner: agent
review: agent
status: in-progress
priority: high
depends_on: [S-001]
estimate: 2
outputs:
  - docs/spikes/C.md
  - apps/spike-c
  - .claude/agents/ux-reviewer.md
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.1, ticket S-005. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

React Flow vs SVG prototype at 360 px, bottom sheet, one uPlot chart; measure C1, C3, C4; prepare C2 for the owner phone trial.

## Done criteria

- [x] Prototype at 360 px with the SVG and React Flow variants of the topology, a bottom sheet and one uPlot chart (`apps/spike-c`)
- [x] C1, C3 and C4 measured (as read in `docs/spikes/C.md`; the master plan definitions were not readable) and recorded with screenshots
- [x] C2 prepared for the owner: steps and what to record are in `docs/spikes/C.md`; the trial itself is S-008
- [x] `ux-reviewer` stub filled in with a checklist
- [x] `python scripts/validate.py` passes; lint, typecheck, tests pass
- [ ] Independent review (ux-reviewer and code-reviewer) done and findings fixed
- [ ] CI green

## Notes

- The model behind the prototype is an illustrative closed-form stand-in, not the engine; the spike note says so. Strings are hard-coded Indonesian (spike only).
- Result: both variants fit at 360 px; SVG costs 95.8 KB gzip for the lab page, React Flow 157.2 KB (52% of the 300 KB budget before engine, quiz or lab code). Recommendation: SVG (owner decides at SG0).
- Finding: the open bottom sheet hides most of the chart at 360 x 800; a real design must show chart and sliders together.
- `npm audit` shows high-severity advisories in dev tooling (picomatch via eslint-plugin-boundaries and vite's file watching, minimatch via typescript-eslint); none is in the shipped bundle. Left as is; a dependency-update ticket should revisit (PLAN K18).
- Screenshots were first written outside the repo because of a relative path in the spec; the stray directory (created by this session) was removed and the path fixed.
- Not measured: a real phone (S-008), Safari, Firefox.
