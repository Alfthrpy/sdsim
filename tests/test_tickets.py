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
        files["date.md"] = "---\nid: P1-070\nstatus: todo\nd: 2020-99-99\n---\n"  # PyYAML raises ValueError
        files["notstr.md"] = "---\nid: P1-071\nstatus: 5\n---\n"
        errs, _ = self.one("[sdlab:P1-064, sdlab:P1-071]", sdlab=files)
        self.assertEqual(len(errs), 1)  # P1-071 has no usable status, so it is unknown; nothing crashes
        self.assertIn("P1-071", errs[0])

    def test_trailing_newline_is_not_a_valid_id(self):
        errs, _ = self.one('["sdlab:P1-064\\n"]', sdlab=sdlab_files(P1_064="done"))
        self.assertTrue(errs)

    def test_duplicates_warn_and_are_counted_once(self):
        _, warns = self.one("[sdlab:P1-064, sdlab:P1-064]", sdlab=sdlab_files(P1_064="done"))
        self.assertEqual(len(warns), 1)
        self.assertIn("more than once", warns[0])
        _, warns = self.one("[sdlab:P1-064, sdlab:P1-064]", sdlab=None)
        self.assertEqual(sum("1 sdlab dependencies not checked" in w for w in warns), 1)
        errs, warns = run({"S-001-a.md": GOOD.format(id="S-001", status="todo", deps="[S-002, S-002]"),
                           "S-002-b.md": GOOD.format(id="S-002", status="todo", deps="[]")})
        self.assertEqual(errs, [])
        self.assertTrue(any("more than once" in w for w in warns))

    def test_any_malformed_depends_on_gives_errors_not_a_crash(self):
        for deps in ("[sdlab: P1-064]", "[null]", "[[S-001]]", "5", "S-002", "{a: 1}"):
            with self.subTest(deps=deps):
                errs, _ = self.one(deps, sdlab=sdlab_files(P1_064="done"))
                self.assertTrue(errs, deps)


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

    def test_malformed_depends_on_does_not_crash_readiness_or_board(self):
        for bad in ([{"sdlab": "P1-064"}], [None], [["S-003"]], 5, "S-003", {"a": 1}, None):
            with self.subTest(bad=bad):
                tickets = [{**t, "title": "T", "estimate": 1, "milestone": "S0", "review": "agent",
                            "_path": Path(f"{t['id']}-x.md")} for t in self.tickets()]
                tickets[1]["depends_on"] = bad
                tickets.append({**tickets[0], "id": "S-004", "owner": "human", "_path": Path("S-004-x.md"),
                                "depends_on": bad})
                common.ready_tickets(tickets, "agent", {})
                board.render(tickets)

    def test_board_sections(self):
        mk = lambda i, status, deps: {"id": i, "status": status, "owner": "agent", "priority": "medium",
                                      "depends_on": deps, "title": "T", "estimate": 1, "milestone": "S0",
                                      "review": "agent", "_path": Path(f"{i}-x.md")}

        def sections(tickets):
            text = board.render(tickets)
            ready = text.split("## Ready for agents")[1].split("\n## ")[0]
            waiting = text.split("## Waiting on sdlab")[1].split("\n## ")[0] if "## Waiting on sdlab" in text else ""
            return text, ready, waiting

        # blocked by an unfinished sdsim ticket: in neither section, even with an sdlab dependency as well
        text, ready, waiting = sections([mk("S-001", "todo", ["S-002", "sdlab:P1-064"]), mk("S-002", "todo", [])])
        self.assertNotIn("S-001", ready)
        self.assertNotIn("S-001", waiting)
        # sdsim dependencies done: waits on sdlab, and only the sdlab id is shown there
        text, ready, waiting = sections([mk("S-001", "todo", ["S-002", "sdlab:P1-064"]), mk("S-002", "done", [])])
        self.assertNotIn("S-001", ready)
        self.assertIn("sdlab:P1-064", waiting)
        self.assertNotIn("S-002", waiting)
        # no ticket has an sdlab dependency: the section is absent, and the board is the same text as before
        text, ready, waiting = sections([mk("S-001", "todo", ["S-002"]), mk("S-002", "done", [])])
        self.assertNotIn("Waiting on sdlab", text)
        self.assertIn("S-001", ready)

    def test_board_text_ignores_the_sdlab_checkout(self):
        tickets = [{**t, "title": "T", "estimate": 1, "milestone": "S0", "review": "agent",
                    "_path": Path(f"{t['id']}-x.md")} for t in self.tickets()]
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "backlog" / "tickets").mkdir(parents=True)
            for name, text in sdlab_files(P1_064="done").items():
                (Path(d) / "backlog" / "tickets" / name).write_text(text, encoding="utf-8")
            with mock.patch.dict(os.environ, {"SDLAB_DIR": d}):
                with_checkout = board.render(tickets)
            with mock.patch.dict(os.environ, {"SDLAB_DIR": str(Path(d) / "nowhere")}):
                without = board.render(tickets)
        self.assertEqual(with_checkout, without)

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
