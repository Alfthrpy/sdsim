"""Fixture tests for the ticket validator. Run: python -m unittest discover tests"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import common  # noqa: E402
import validate  # noqa: E402

GOOD = """---
id: {id}
title: "T"
milestone: S0
type: infra
owner: agent
review: agent
status: {status}
priority: medium
depends_on: {deps}
estimate: 1
outputs: []
---

## Context
x

## Tasks
1. x

## Done criteria
- [ ] x

## Notes
(Filled in during the work.)
"""


def run(files: dict[str, str]):
    with tempfile.TemporaryDirectory() as d:
        tdir = Path(d)
        for name, text in files.items():
            (tdir / name).write_text(text, encoding="utf-8")
        old = (common.TICKETS_DIR, validate.rel)
        common.TICKETS_DIR = tdir
        validate.rel = lambda p: p.name
        validate.errors.clear()
        validate.warnings.clear()
        try:
            validate.check_tickets()
            return list(validate.errors), list(validate.warnings)
        finally:
            common.TICKETS_DIR, validate.rel = old


class Tickets(unittest.TestCase):
    def test_valid(self):
        errs, _ = run({"S-001-a.md": GOOD.format(id="S-001", status="todo", deps="[]")})
        self.assertEqual(errs, [])

    def test_bad_id_and_name(self):
        errs, _ = run({"P1-001-a.md": GOOD.format(id="P1-001", status="todo", deps="[]")})
        self.assertTrue(any("invalid id" in e for e in errs))
        errs, _ = run({"x.md": GOOD.format(id="S-002", status="todo", deps="[]")})
        self.assertTrue(any("file name must start" in e for e in errs))

    def test_unknown_dependency_and_cycle(self):
        errs, _ = run({"S-001-a.md": GOOD.format(id="S-001", status="todo", deps="[S-009]")})
        self.assertTrue(any("unknown ticket" in e for e in errs))
        errs, _ = run({"S-001-a.md": GOOD.format(id="S-001", status="todo", deps="[S-002]"),
                       "S-002-b.md": GOOD.format(id="S-002", status="todo", deps="[S-001]")})
        self.assertTrue(any("cycle" in e for e in errs))

    def test_blocked_needs_a_reason(self):
        errs, _ = run({"S-001-a.md": GOOD.format(id="S-001", status="blocked", deps="[]")})
        self.assertTrue(any("blocked" in e for e in errs))


if __name__ == "__main__":
    unittest.main()
