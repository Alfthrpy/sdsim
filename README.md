# sdsim

The simulation system for SD Lab (a free, Indonesian-language platform for learning backend system design): a queueing-theory discrete-event simulator, the contract that says what it can simulate, the lab runtime that grades learner edits, and the mobile-first UI. Companion of the content repository `../sdlab`.

Status: **early**. No simulator code yet; the plan and the first tickets are being set up. Everything agents read and write here is in English; learner-facing text is Indonesian and lives in `sdlab` lab specs and the contract's i18n file.

## Where to start

| You are | Read |
| --- | --- |
| An agent (Claude or other) | [`AGENTS.md`](AGENTS.md), then [`docs/HANDOFF.md`](docs/HANDOFF.md), then [`backlog/BOARD.md`](backlog/BOARD.md) |
| The owner | [`docs/PLAN.md`](docs/PLAN.md), then [`docs/workflow.md`](docs/workflow.md) |

## Repo map

```
AGENTS.md               agent working rules (read every session)
docs/
  HANDOFF.md            context for a new session: what exists, what was decided, what is next
  PLAN.md               development plan: milestones, tickets, toolchain, risks
  ROADMAP.md            where this repo sits in the three project phases
  workflow.md           ticket system, session flow, branch, PR, review
  decisions/            ADRs
  conventions/          engineering conventions
backlog/
  BOARD.md              status board (generate: python scripts/board.py)
  tickets/              one file = one ticket
templates/              ticket and session-log templates
sessions/               log of each work session
scripts/                validate.py, board.py, new_ticket.py (ticket tooling)
tests/                  tests for the ticket tooling
.claude/                subagents and slash commands for Claude Code
```

Planned (created by the first tickets): `contract/` (catalog, JSON Schema, i18n), `packages/engine`, `packages/lab-runtime`, `packages/ui`, `apps/web`.

## Commands

```bash
pip install pyyaml
python scripts/validate.py
python -m unittest discover tests
python scripts/board.py
python scripts/new_ticket.py "Ticket title" --milestone S0 --type spike
```

## License

To be decided by the owner (the content repository `sdlab` uses MIT for code and CC BY 4.0 for content as interim defaults). No license file is added until then.
