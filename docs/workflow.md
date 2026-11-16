# Workflow: tickets, sessions, review

All work goes through **tickets**. One work session (agent or human) takes one ticket, finishes it until its done-criteria are met, then hands it over for review. No work happens outside a ticket. If you discover new work, create a new ticket.

## 1. Tickets

One Markdown file in `backlog/tickets/`, named `<ID>-<slug>.md`, with YAML frontmatter:

```yaml
id: S-020                # S-001 style; sub-tickets S-020a, S-020b
title: Engine event heap and clock
milestone: S2            # S0 Bootstrap & spikes, S1 Contract v0 & matrix, S2 Caching vertical slice,
                         # S3 Engine complete & validated, S4 Labs per unit, S5 Incidents, QA, release
type: engine             # infra | spike | contract | engine | ui | lab | validation | decision | review | release
owner: agent             # who DOES the work: agent | human
review: agent            # who REVIEWS it: agent | human | none
status: todo             # todo | in-progress | review | done | blocked
priority: high           # high | medium | low
depends_on: [S-003]      # tickets that must be done first
estimate: 2              # estimated number of sessions
outputs:                 # files this ticket creates/changes
  - packages/engine
```

The ticket body has: **Context**, **Tasks**, **Done criteria** (checklist), and **Notes** (filled in during the work).

### Who does what

| Kind of work | owner | review |
| --- | --- | --- |
| Code, tests, contract, docs, scripts | agent | agent |
| Product decisions (scope, priorities, naming, license) | human | none |
| Milestone gates (spike go/no-go, contract freeze, release) | agent prepares, human decides | human |
| Measurements only the owner can take (reference laptop, own phone) | human | none |
| External access (create repo or remote, accounts, hosting) | human | none |
| Simulator semantics that make claims about real systems | agent | agent (`model-reviewer`) plus a human sample at the QA gate |

`review: agent` means a **reviewer subagent that did not do the work** checks the ticket; after it passes and CI is green, the agent may merge its own PR. `review: human` means the PR waits for the owner; the agent must not merge.

### Status

```
todo -> in-progress -> review -> done
          |
       blocked  (write the reason in Notes + the blocking ticket in depends_on)
```

A ticket may only be taken when all its `depends_on` are `done`.

## 2. Flow of one session

1. **Orient.** Read `AGENTS.md`, `backlog/BOARD.md`, and the latest session log in `sessions/`.
2. **Pick a ticket.** If the owner does not name one, take the `todo` ticket with `owner: agent`, all dependencies `done`, highest priority, lowest number.
3. **Claim.** Create branch `t/<ID>-<slug>`, set status to `in-progress`, commit.
4. **Work** per the Tasks. If the ticket is too big for one session, split it into sub-tickets and do the first.
5. **Validate.** `python scripts/validate.py` plus the code checks in `docs/PLAN.md`. Tick the Done criteria that are met.
6. **Review.** `review: agent` -> call a reviewer subagent, fix its findings. `review: human` -> set status to `review`.
7. **Record.** Write the session log at `sessions/YYYY-MM-DD-<ID>.md` (template: `templates/session-log.md`). Fill in the Notes section of the ticket.
8. **Hand off.** Run `python scripts/board.py`, commit, push, open a PR titled `[<ID>] <title>`. If `review: agent` and CI is green, merge and set `done`.

One session = one ticket (or one sub-ticket). If a session stops midway, the status stays `in-progress` and the session log explains how far it got.

## 3. Branch, commit, PR

- Branch: `t/S-020-engine-event-heap`
- Commit: `[S-020] add event heap and clock`
- PR: title `[S-020] <ticket title>`, body = summary, outputs, done-criteria checklist, review result.
- `main` changes only through PRs.

## 4. The owner's role

1. Do `owner: human` tickets (decisions, gates, measurements, external access).
2. Review `review: human` PRs.
3. Occasionally spot-check merged `review: agent` PRs.
4. Start agent sessions: "do the next ticket" or "do S-0xx".

## 5. Cross-repo work with sdlab

A change to the contract that affects lab specs is a contract change: it follows the change protocol in `docs/PLAN.md`, bumps the contract version, and `sdlab` is updated by a ticket in `sdlab` that vendors the new version. Never edit `sdlab` files from a `sdsim` session, and never edit `sdsim` from an `sdlab` session; write the needed follow-up as a ticket in the other repo (or tell the owner).
