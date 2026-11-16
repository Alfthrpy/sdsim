#!/usr/bin/env python3
"""Validate tickets (and later: the contract and the code checks that need a script).

Exit code 1 on any error. Warnings are printed but do not fail.
"""
from __future__ import annotations

import re
import sys

from common import (MILESTONES, OWNERS, PRIORITIES, REVIEWS, ROOT, STATUSES, TICKET_ID, TYPES, load_tickets)

errors: list[str] = []
warnings: list[str] = []


def err(where: str, msg: str):
    errors.append(f"ERROR  {where}: {msg}")


def warn(where: str, msg: str):
    warnings.append(f"WARN   {where}: {msg}")


def rel(p) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def find_cycle(graph: dict[str, list[str]]):
    WHITE, GREY, BLACK = 0, 1, 2
    color = {n: WHITE for n in graph}
    stack: list[str] = []

    def dfs(n):
        color[n] = GREY
        stack.append(n)
        for m in graph.get(n, []):
            if m not in color:
                continue
            if color[m] == GREY:
                return stack[stack.index(m):] + [m]
            if color[m] == WHITE:
                r = dfs(m)
                if r:
                    return r
        stack.pop()
        color[n] = BLACK
        return None

    for n in graph:
        if color[n] == WHITE:
            r = dfs(n)
            if r:
                return r
    return None


def check_tickets():
    tickets = load_tickets()
    ids: dict[str, str] = {}
    for t in tickets:
        where = rel(t["_path"])
        if not t["_has_fm"]:
            err(where, "YAML frontmatter not found")
            continue
        tid = t.get("id")
        if not tid or not TICKET_ID.match(str(tid)):
            err(where, f"invalid id: {tid!r} (format S-000 or S-000a)")
            continue
        if not t["_path"].name.startswith(f"{tid}-"):
            err(where, f"file name must start with '{tid}-'")
        if tid in ids:
            err(where, f"duplicate id with {ids[tid]}")
        ids[tid] = where
        for field, allowed in [("status", STATUSES), ("owner", OWNERS), ("review", REVIEWS),
                               ("type", TYPES), ("priority", PRIORITIES), ("milestone", MILESTONES)]:
            if t.get(field) not in allowed:
                err(where, f"{field}={t.get(field)!r}, must be one of {allowed}")
        if not t.get("title"):
            err(where, "title is empty")
        if not isinstance(t.get("depends_on", []), list):
            err(where, "depends_on must be a list")
        for section in ("## Context", "## Tasks", "## Done criteria"):
            if section not in t["_body"]:
                err(where, f"section '{section}' is missing")
        if t.get("status") == "done" and re.search(r"^- \[ \]", t["_body"], re.M):
            warn(where, "status is done but some criteria are still unticked")
        if t.get("status") == "blocked" and "(Filled in during the work.)" in t["_body"]:
            err(where, "status is blocked with no explanation in Notes")

    status = {t.get("id"): t.get("status") for t in tickets}
    for t in tickets:
        where = rel(t["_path"])
        for d in t.get("depends_on") or []:
            if d not in status:
                err(where, f"depends_on names an unknown ticket: {d}")
            elif t.get("status") in ("in-progress", "review", "done") and status[d] != "done":
                warn(where, f"status is {t.get('status')} but dependency {d} is still {status[d]}")

    graph = {t.get("id"): list(t.get("depends_on") or []) for t in tickets}
    cyc = find_cycle(graph)
    if cyc:
        err("backlog", "ticket dependency cycle: " + " -> ".join(cyc))
    return tickets


def main():
    check_tickets()
    for line in warnings:
        print(line)
    for line in errors:
        print(line)
    print(f"\n{len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
