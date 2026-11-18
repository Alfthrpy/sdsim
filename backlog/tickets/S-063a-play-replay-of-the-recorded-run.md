---
id: S-063a
title: "Play replay of the recorded run"
milestone: S2
type: ui
owner: agent
review: agent
status: todo
priority: high
depends_on: [S-061, S-062, S-021, S-050]
estimate: 1
outputs:
  - packages/ui/play
---

## Context

Added by S-103 (`docs/design/lab-flow.md`): the owner wants to watch the system run, hold or fail, in the MVP. Play replays the recorded run of seed 1 (one of the graded seeds); it does not run a second simulation.

## Tasks

Per `docs/design/lab-flow.md` sections 2 and 4: timeline with play, pause, speed (1x, 10x, 60x) and a scrubber; node states ok, strained, failing from the recorded series (label and color, thresholds illustrative); captions from `scenario.timeline`; the chart follows the timeline; the baseline can be played before any edit; all text from `id.yaml` or the lab spec.

## Done criteria

- [ ] The baseline run of the caching lab can be played, paused, scrubbed and sped up on a 360 px screen with every control at least 44 px
- [ ] Node state is derived from the recorded series with a label as well as a color
- [ ] The replay shows seed 1 of the graded seeds (same record as the grading result)
- [ ] `ux-reviewer` and `code-reviewer` passes done; `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
