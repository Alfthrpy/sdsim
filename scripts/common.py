"""Shared helpers for repo scripts (ticket tooling)."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
TICKETS_DIR = ROOT / "backlog" / "tickets"

# Ticket ids follow the STUD Simulator Master Plan: S-001, sub-tickets S-001a.
TICKET_ID = re.compile(r"^S-\d{3}[a-z]?$")
STATUSES = ["todo", "in-progress", "review", "blocked", "done"]
OWNERS = ["agent", "human"]
REVIEWS = ["agent", "human", "none"]
TYPES = ["infra", "spike", "contract", "engine", "ui", "lab", "validation", "decision", "review", "release"]
PRIORITIES = ["high", "medium", "low"]
MILESTONES = ["S0", "S1", "S2", "S3", "S4", "S5"]
MILESTONE_NAMES = {
    "S0": "Bootstrap & spikes", "S1": "Contract v0 & matrix", "S2": "Caching vertical slice",
    "S3": "Engine complete & validated", "S4": "Labs per unit", "S5": "Incidents, QA, release",
}

FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n?(.*)\Z", re.S)


def split_frontmatter(text: str) -> tuple[dict | None, str]:
    m = FRONTMATTER.match(text)
    if not m:
        return None, text
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def load_tickets() -> list[dict]:
    tickets = []
    for p in sorted(TICKETS_DIR.glob("*.md")):
        fm, body = split_frontmatter(p.read_text(encoding="utf-8"))
        tickets.append({"_path": p, "_body": body, **(fm or {}), "_has_fm": fm is not None})
    return tickets


def sort_key(t: dict):
    prio = {"high": 0, "medium": 1, "low": 2}.get(t.get("priority"), 3)
    return (prio, str(t.get("id")))


def ready_tickets(tickets: list[dict], owner: str | None = "agent") -> list[dict]:
    status = {t.get("id"): t.get("status") for t in tickets}
    out = []
    for t in tickets:
        if t.get("status") != "todo":
            continue
        if owner and t.get("owner") != owner:
            continue
        if all(status.get(d) == "done" for d in t.get("depends_on") or []):
            out.append(t)
    return sorted(out, key=sort_key)
