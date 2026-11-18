#!/usr/bin/env python3
"""Run every case in contract/fixtures/cases.yaml through sdlab's own validator (scripts/validate.py check_labs).

  python contract/scripts/check_against_sdlab.py ../sdlab

Expected agreement (see the header of cases.yaml):
  schema: invalid                 -> sdlab reports an error
  schema: valid with `sdlab:`     -> sdlab reports an error containing that text
  schema: valid otherwise         -> sdlab reports no error
  `differs:` cases                -> reported, not counted as disagreements
Needs PyYAML and a checkout of sdlab. Exit status 1 on any disagreement.
"""
import copy
import sys
import tempfile
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent.parent
SDLAB = Path(sys.argv[1] if len(sys.argv) > 1 else "../sdlab").resolve()
sys.path.insert(0, str(SDLAB / "scripts"))
import validate  # noqa: E402


def apply_patch(doc, ops):
    root = copy.deepcopy(doc)
    for op in ops or []:
        keys = op["path"].split("/")[1:]
        last = keys.pop()
        parent = root
        for k in keys:
            parent = parent[int(k)] if isinstance(parent, list) else parent[k]
        if isinstance(parent, list):
            i = len(parent) if last == "-" else int(last)
            if op["op"] == "remove":
                parent.pop(i)
            elif op["op"] == "add":
                parent.insert(i, op["value"])
            else:
                parent[i] = op["value"]
        elif op["op"] == "remove":
            parent.pop(last, None)
        else:
            parent[last] = op["value"]
    return root


def run(spec):
    base = spec["concept"]
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        folder = root / "concepts" / base
        folder.mkdir(parents=True)
        (folder / "lab.yaml").write_text(yaml.safe_dump(spec, allow_unicode=True, sort_keys=False), encoding="utf-8")
        registry = {s: {"type": "article", "status": "approved", "usage": "rewrite-only"} for s in spec.get("sources", [])
                    if isinstance(s, str)}
        concepts = {base: {"formats": ["lesson", "lab"], "status": "planned"},
                    "connection-pooling": {"formats": ["lesson"], "status": "planned"}}
        old = (validate.CONTENT, validate.rel, validate.CASES)
        validate.CONTENT, validate.rel, validate.CASES = root, lambda p: p.name, root / "none.yaml"
        validate.errors.clear()
        validate.warnings.clear()
        try:
            validate.check_labs(registry, concepts)
            return list(validate.errors)
        finally:
            validate.CONTENT, validate.rel, validate.CASES = old


base = yaml.safe_load((HERE / "fixtures/valid/caching-basics.yaml").read_text(encoding="utf-8"))
cases = yaml.safe_load((HERE / "fixtures/cases.yaml").read_text(encoding="utf-8"))
bad, differs = [], []
for c in cases:
    errs = run(apply_patch(base, c.get("patch")))
    if c.get("differs"):
        differs.append((c["name"], bool(errs), c["differs"]))
        continue
    if c["schema"] == "invalid":
        ok = bool(errs)
    elif c.get("sdlab"):
        ok = any(c["sdlab"].split(" (")[0].lower() in e.lower() for e in errs)
    else:
        ok = not errs
    if not ok:
        bad.append((c["name"], c["schema"], c.get("sdlab"), errs[:2]))
print(f"{len(cases)} cases, {len(bad)} disagreements, {len(differs)} known differences")
for name, sdlab_errors, why in differs:
    print(f"  differs: {name}: sdlab {'errors' if sdlab_errors else 'accepts'} ({why})")
for b in bad:
    print("  DISAGREE:", b)
sys.exit(1 if bad else 0)
