#!/usr/bin/env python3
"""Create a new ticket from the template.

  python scripts/new_ticket.py "Engine: event heap" --milestone S2 --type engine \
      [--depends S-003 sdlab:P1-064] [--id S-020] [--owner agent] [--review agent] [--priority medium]

Without --id, the next free number is used (S-0xx). With --sub and a dependency, a sub-ticket id
(S-020a, b, ...) is derived from the first dependency, which must then be an S-0xx ticket.
A dependency on an sdlab ticket is written `sdlab:<id>` (docs/workflow.md); validate.py checks it.
"""
from __future__ import annotations

import argparse
import re
import string

from common import MILESTONES, OWNERS, PRIORITIES, REVIEWS, TICKETS_DIR, TYPES, load_tickets


def slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return "-".join(s.split("-")[:6]) or "ticket"


def next_id(existing: set[str], parent: str | None) -> str:
    if parent and re.match(r"^S-\d{3}$", parent):
        for ch in string.ascii_lowercase:
            cand = parent + ch
            if cand not in existing:
                return cand
        raise SystemExit("Out of sub-ticket ids (a-z).")
    nums = [int(m.group(1)) for i in existing if (m := re.match(r"^S-(\d{3})$", str(i)))]
    n = max(nums, default=0) + 1
    while f"S-{n:03d}" in existing:
        n += 1
    return f"S-{n:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("title")
    ap.add_argument("--id")
    ap.add_argument("--milestone", required=True, choices=MILESTONES)
    ap.add_argument("--type", required=True, choices=TYPES)
    ap.add_argument("--owner", default="agent", choices=OWNERS)
    ap.add_argument("--review", default="agent", choices=REVIEWS)
    ap.add_argument("--priority", default="medium", choices=PRIORITIES)
    ap.add_argument("--depends", nargs="*", default=[])
    ap.add_argument("--estimate", type=int, default=1)
    ap.add_argument("--sub", action="store_true", help="derive a sub-ticket id from the first dependency")
    a = ap.parse_args()

    if a.sub and not (a.depends and re.match(r"^S-\d{3}$", a.depends[0])):
        raise SystemExit("--sub needs the first --depends to be an S-0xx ticket (the parent).")
    existing = {t.get("id") for t in load_tickets()}
    parent = a.depends[0] if a.depends and a.sub else None
    tid = a.id or next_id(existing, parent)
    if tid in existing:
        raise SystemExit(f"{tid} already exists.")

    deps = "[" + ", ".join(a.depends) + "]"
    text = f"""---
id: {tid}
title: "{a.title}"
milestone: {a.milestone}
type: {a.type}
owner: {a.owner}
review: {a.review}
status: todo
priority: {a.priority}
depends_on: {deps}
estimate: {a.estimate}
outputs: []
---

## Context

(Why this ticket exists.)

## Tasks

1. ...

## Done criteria

- [ ] ...
- [ ] `python scripts/validate.py` passes

## Notes

(Filled in during the work.)
"""
    path = TICKETS_DIR / f"{tid}-{slugify(a.title)}.md"
    path.write_text(text, encoding="utf-8")
    print(path)


if __name__ == "__main__":
    main()
