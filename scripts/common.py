"""Shared helpers for repo scripts (ticket tooling)."""
from __future__ import annotations

import os
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
TICKETS_DIR = ROOT / "backlog" / "tickets"

# Ticket ids follow the STUD Simulator Master Plan: S-001, sub-tickets S-001a.
TICKET_ID = re.compile(r"^S-\d{3}[a-z]?$")
# A dependency on a ticket in the sibling repo `sdlab` is written `sdlab:<id>` (PLAN R16). sdlab ids are
# P1-064 style; its own validator uses the same pattern.
SDLAB_PREFIX = "sdlab:"
SDLAB_DEP = re.compile(r"^sdlab:(P\d-\d{3}[a-z]?)$")
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


def is_sdlab_dep(dep) -> bool:
    return isinstance(dep, str) and dep.startswith(SDLAB_PREFIX)


def sdlab_dir() -> Path:
    """Where the sdlab checkout is: $SDLAB_DIR, else the sibling folder `../sdlab`."""
    env = os.environ.get("SDLAB_DIR")
    return Path(env) if env else ROOT.parent / "sdlab"


def load_sdlab_status() -> dict[str, str] | None:
    """Ticket id -> status from the sdlab checkout, read only. None when there is no checkout.

    A ticket file that cannot be parsed is skipped; this script never edits sdlab.
    """
    tdir = sdlab_dir() / "backlog" / "tickets"
    if not tdir.is_dir():
        return None
    out: dict[str, str] = {}
    for p in sorted(tdir.glob("*.md")):
        try:
            fm, _ = split_frontmatter(p.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, yaml.YAMLError):
            continue
        if isinstance(fm, dict) and isinstance(fm.get("id"), str) and isinstance(fm.get("status"), str):
            out[fm["id"]] = fm["status"]
    return out


def dep_done(dep, status: dict, sdlab_status: dict | None) -> bool:
    """True when one `depends_on` entry is done. An sdlab entry is done only if the sdlab checkout says so."""
    if is_sdlab_dep(dep):
        m = SDLAB_DEP.match(dep)
        return bool(m and sdlab_status is not None and sdlab_status.get(m.group(1)) == "done")
    return isinstance(dep, str) and status.get(dep) == "done"


def sort_key(t: dict):
    prio = {"high": 0, "medium": 1, "low": 2}.get(t.get("priority"), 3)
    return (prio, str(t.get("id")))


def ready_tickets(tickets: list[dict], owner: str | None = "agent",
                  sdlab_status: dict | None = None) -> list[dict]:
    status = {t.get("id"): t.get("status") for t in tickets}
    out = []
    for t in tickets:
        if t.get("status") != "todo":
            continue
        if owner and t.get("owner") != owner:
            continue
        if all(dep_done(d, status, sdlab_status) for d in t.get("depends_on") or []):
            out.append(t)
    return sorted(out, key=sort_key)
