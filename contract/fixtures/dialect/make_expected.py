#!/usr/bin/env python3
"""Regenerate expected.json: how PyYAML (what sdlab's validate.py uses, yaml.safe_load) reads each snippet.

  python contract/fixtures/dialect/make_expected.py

contract/test/dialect.test.ts checks that the TypeScript loader (contract/src/yaml.ts) gives the same typed values.
"""
import datetime
import json
import math
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent


def tag(v):
    if v is None:
        return {"t": "null"}
    if isinstance(v, bool):
        return {"t": "bool", "v": v}
    if isinstance(v, int):
        return {"t": "int", "v": v}
    if isinstance(v, float):
        if math.isnan(v):
            return {"t": "float", "v": "nan"}
        if math.isinf(v):
            return {"t": "float", "v": "inf" if v > 0 else "-inf"}
        return {"t": "float", "v": v}
    if isinstance(v, str):
        return {"t": "str", "v": v}
    if isinstance(v, datetime.datetime):
        return {"t": "datetime", "v": v.isoformat()}
    if isinstance(v, datetime.date):
        return {"t": "date", "v": v.isoformat()}
    if isinstance(v, list):
        return {"t": "list", "v": [tag(x) for x in v]}
    if isinstance(v, dict):
        return {"t": "map", "v": {str(k): tag(x) for k, x in v.items()}}
    return {"t": type(v).__name__, "v": str(v)}


out = []
for text in json.loads((HERE / "snippets.json").read_text(encoding="utf-8")):
    try:
        out.append({"yaml": text, "pyyaml": tag(yaml.safe_load(text))})
    except yaml.YAMLError as e:
        out.append({"yaml": text, "pyyaml": {"t": "error", "v": type(e).__name__}})
(HERE / "expected.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"{len(out)} snippets, PyYAML {yaml.__version__}")
