---
id: S-002
title: "Ticket tooling: sdlab dependencies"
milestone: S0
type: infra
owner: agent
review: agent
status: review
priority: medium
depends_on: [S-001]
estimate: 1
outputs:
  - scripts/
  - tests/
---

## Context

Part of the MVP path (BG1 + BG2, "early access"). Source row: `docs/PLAN.md` section 8.1, ticket S-002. The PLAN row is the spec; expand this ticket's Tasks when it is claimed, and split it if it will not fit one session.

## Tasks

1. Accept `sdlab:<id>` in `depends_on` (`scripts/common.py`, `scripts/validate.py`); malformed entries are error lines, never tracebacks (R16).
2. Read the status of an sdlab ticket from `$SDLAB_DIR` or `../sdlab` when present, read-only.
3. `scripts/board.py`: `--next` uses the real sdlab status; the committed `BOARD.md` must not depend on it (CI has no sdlab checkout).
4. Fixture tests in `tests/test_tickets.py`; a short section in `docs/workflow.md`.

## Done criteria

- [x] The PLAN row's outputs exist and behave as described above
- [ ] Definition of done in `docs/PLAN.md` section 9.7 is met (open: PR and CI)
- [x] `python scripts/validate.py` passes

## Notes

- Implemented: `sdlab:<id>` in `depends_on` (pattern `P\d-\d{3}[a-z]?`, the same as sdlab's own); status read from `$SDLAB_DIR` or `../sdlab`, read-only, unparsable files skipped; `validate.py` errors on a malformed or unknown sdlab id, warns on an unfinished sdlab dependency and on a repeated entry, and says once how many distinct ids were not checked when there is no checkout; `board.py --next` uses the real status; `BOARD.md` lists such tickets under "Waiting on sdlab" (only while one exists) and never as ready, so it does not depend on the checkout.
- Checked against the real sdlab checkout (`SDLAB_DIR=/home/user/alfthrpy/sdlab`): 77 sdlab tickets read, every id matches the pattern, `validate.py` gives 0 errors.
- Tests: 20 in `tests/test_tickets.py` (4 existing, 10 for sdlab dependencies in `validate.py`, 6 for readiness and the board); mutations of the readiness rule, the board filter, the `ValueError` catch, the id anchor, the board join and the duplicate warning each fail a test.
- Review: `code-reviewer`, pass with minor fixes. Fixed: `board.py` and `ready_tickets` crashed on a malformed `depends_on` (new `deps_of`), `ValueError` from an sdlab file with an impossible date, a trailing newline accepted by the id pattern (`\Z`), repeated entries, a redundant cycle filter, a board test that did not pin the filter, `new_ticket.py --sub` with a non-S parent now fails instead of numbering silently, docstring and docs.
- Not done, by design: CI does not check out sdlab, so on GitHub the ids are only format-checked. Adding a checkout step to the workflow is a separate, small change for the owner to approve.
- No ticket in this repo uses an `sdlab:` dependency yet. S-080 is the first one expected (its Context says to add them once sdlab has the tickets).
