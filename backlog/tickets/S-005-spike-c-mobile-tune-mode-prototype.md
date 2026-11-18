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
- [x] C2 prepared for the owner: steps, a precision drill and what to record are in `docs/spikes/C.md`; the trial itself is S-008
- [x] `ux-reviewer` stub filled in with a checklist
- [x] `python scripts/validate.py` passes; lint, typecheck, tests pass
- [x] Independent review (ux-reviewer and code-reviewer) done and findings fixed (see Notes)
- [ ] CI green

## Notes

- The model behind the prototype is an illustrative closed-form stand-in, not the engine, and it makes the task easy (96% of slider combinations pass); the spike note says so. Strings are hard-coded Indonesian (spike only).
- Result: both variants fit at 360 px and 640 px height; SVG costs 94.7 KB JS gzip for the lab page, React Flow 153.5 KB (51% of the 300 KB budget before engine, quiz or lab code). Tentative recommendation: SVG (owner decides at SG0).
- React Flow's attribution link (50 x 14 px) is below the 44 px target and cannot be removed without the paid option.
- Review (ux-reviewer and code-reviewer, both: pass with fixes). Fixed: keyboard cannot open the sheet (click handler added), closed-sheet controls reachable (`inert`), clipped axis label, chart hidden behind the open sheet (page scrolls to the bottom on open; checked at 360 x 800 and 360 x 640), badges and a caption with the target line on the headline numbers, database bar number and 60% mark, non-interactive React Flow nodes were tab stops, the 44 px scan no longer excludes anything silently, the task test no longer claims touch (a separate real-tap precision test was added), latency rows are three loads with a synchronous-cost column and always-new slider values, the S-005 session log is its own file, spec and config files are type-checked, the measurement server uses port 5175 on 127.0.0.1 and no longer clashes with the dev server. Not changed: the stand-in model stays easy (documented); a 320 px width, Safari, Firefox and a larger font scale are not tested; hard-coded strings remain (spike).
- Dependencies added beyond PLAN 5.3: `@vitejs/plugin-react` 6.3.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0 (needed by React with Vite), all exact; plus `react`, `react-dom`, `@xyflow/react` 12.12.1, `uplot` 1.6.32 from the plan. The spike package relies on the root `vite`, `typescript` and `@playwright/test`.
- `npm audit` shows high-severity advisories in dev tooling (picomatch via eslint-plugin-boundaries and vite's watcher, minimatch via typescript-eslint); none is in the shipped bundle. Left as is; a dependency-update ticket should revisit (PLAN K18).
- Screenshots were first written outside the repo because of a relative path in the spec; the stray directory (created by this session) was removed and the path fixed.
- Not measured: a real phone (S-008), Safari, Firefox, 320 px and 412 px widths.
