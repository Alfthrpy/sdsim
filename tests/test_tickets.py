"""Fixture tests for the ticket validator. Run: python -m unittest discover tests"""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import board  # noqa: E402
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


SDLAB_GOOD = """---
id: {id}
title: "T"
status: {status}
---

body
"""


def sdlab_files(**statuses: str) -> dict[str, str]:
    """A fake sdlab backlog: {"P1-064": "done"} -> one ticket file per id (keyword names use `_` for `-`)."""
    return {f"{k.replace('_', '-')}-x.md": SDLAB_GOOD.format(id=k.replace("_", "-"), status=v)
            for k, v in statuses.items()}


def run(files: dict[str, str], sdlab: dict[str, str] | None = None):
    """Validate fake sdsim tickets. `sdlab` is the file map of a fake sdlab backlog, or None for no checkout."""
    with tempfile.TemporaryDirectory() as d:
        tdir = Path(d) / "tickets"
        tdir.mkdir()
        for name, text in files.items():
            (tdir / name).write_text(text, encoding="utf-8")
        sdroot = Path(d) / "sdlab"
        if sdlab is not None:
            (sdroot / "backlog" / "tickets").mkdir(parents=True)
            for name, text in sdlab.items():
                (sdroot / "backlog" / "tickets" / name).write_text(text, encoding="utf-8")
        old = (common.TICKETS_DIR, validate.rel)
        common.TICKETS_DIR = tdir
        validate.rel = lambda p: p.name
        validate.errors.clear()
        validate.warnings.clear()
        try:
            with mock.patch.dict(os.environ, {"SDLAB_DIR": str(sdroot)}):
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


class SdlabDependencies(unittest.TestCase):
    def one(self, deps: str, status: str = "todo", sdlab=None):
        return run({"S-001-a.md": GOOD.format(id="S-001", status=status, deps=deps)}, sdlab)

    def test_known_done_dependency_is_clean(self):
        errs, warns = self.one("[sdlab:P1-064]", "in-progress", sdlab_files(P1_064="done"))
        self.assertEqual((errs, warns), ([], []))

    def test_unknown_sdlab_id_is_an_error(self):
        errs, _ = self.one("[sdlab:P1-999]", sdlab=sdlab_files(P1_064="done"))
        self.assertTrue(any("unknown sdlab ticket" in e for e in errs))

    def test_malformed_ids_are_errors_not_crashes(self):
        for deps in ("[sdlab:foo]", "[sdlab:S-001]", "[sdlab: P1-064]", "[sdlab:p1-064]", "[sdlab:]"):
            with self.subTest(deps=deps):
                errs, _ = self.one(deps, sdlab=sdlab_files(P1_064="done"))
                self.assertTrue(errs, deps)

    def test_no_checkout_is_one_warning_and_no_error(self):
        errs, warns = self.one("[sdlab:P1-064, sdlab:P1-065]", sdlab=None)
        self.assertEqual(errs, [])
        self.assertEqual(len(warns), 1)
        self.assertIn("2 sdlab dependencies not checked", warns[0])

    def test_started_before_the_sdlab_ticket_is_done_warns(self):
        _, warns = self.one("[sdlab:P1-064]", "in-progress", sdlab_files(P1_064="todo"))
        self.assertTrue(any("sdlab:P1-064" in w and "todo" in w for w in warns))
        _, warns = self.one("[sdlab:P1-064]", "todo", sdlab_files(P1_064="todo"))
        self.assertEqual(warns, [])

    def test_sdlab_dependency_is_not_part_of_a_cycle(self):
        errs, _ = run({"S-001-a.md": GOOD.format(id="S-001", status="todo", deps="[sdlab:P1-064, S-002]"),
                       "S-002-b.md": GOOD.format(id="S-002", status="todo", deps="[sdlab:P1-064]")},
                      sdlab_files(P1_064="done"))
        self.assertEqual(errs, [])

    def test_unreadable_sdlab_files_are_skipped(self):
        files = sdlab_files(P1_064="done")
        files["bad.md"] = "---\n: : [\n---\n"
        files["nofm.md"] = "no frontmatter"
        errs, _ = self.one("[sdlab:P1-064]", sdlab=files)
        self.assertEqual(errs, [])


class Readiness(unittest.TestCase):
    def tickets(self):
        mk = lambda i, deps: {"id": i, "status": "todo", "owner": "agent", "priority": "medium", "depends_on": deps}
        return [mk("S-001", ["sdlab:P1-064"]), mk("S-002", ["S-003"]), {**mk("S-003", []), "status": "done"}]

    def ids(self, sdlab_status):
        return [t["id"] for t in common.ready_tickets(self.tickets(), "agent", sdlab_status)]

    def test_sdlab_dependency_needs_a_done_sdlab_ticket(self):
        self.assertEqual(self.ids({"P1-064": "done"}), ["S-001", "S-002"])
        self.assertEqual(self.ids({"P1-064": "review"}), ["S-002"])
        self.assertEqual(self.ids({}), ["S-002"])

    def test_no_checkout_means_not_ready(self):
        self.assertEqual(self.ids(None), ["S-002"])

    def test_board_file_does_not_depend_on_sdlab(self):
        tickets = [{**t, "title": "T", "estimate": 1, "milestone": "S0", "review": "agent",
                    "_path": Path(f"{t['id']}-x.md")} for t in self.tickets()]
        text = board.render(tickets)
        ready_part = text.split("## Waiting on sdlab")[0]
        self.assertIn("## Waiting on sdlab", text)
        self.assertIn("sdlab:P1-064", text)
        self.assertNotIn("S-001", ready_part.split("## Ready for agents")[1])


if __name__ == "__main__":
    unittest.main()
