import { parse } from "yaml";

const BOOL = "tag:yaml.org,2002:bool";
// PyYAML's boolean words: only these 18 spellings (the `yaml` package's YAML 1.1 mode also takes y and n).
const PY_TRUE = /^(?:yes|Yes|YES|true|True|TRUE|on|On|ON)$/;
const PY_FALSE = /^(?:no|No|NO|false|False|FALSE|off|Off|OFF)$/;
// PyYAML reads 1e3 and 1.5e3 as strings: an exponent needs a dot in the mantissa and a sign (1.0e+3).
const PY_FLOAT_EXP = /^(?:[-+]?(?:[0-9][0-9_]*)\.[0-9_]*|\.[0-9][0-9_]*)[eE][-+][0-9]+$/;

type Tag = { tag?: string; format?: string; test?: RegExp };

/**
 * Parse YAML the way sdlab does: PyYAML reads YAML 1.1, so `yes`, `no`, `on`, `off` are booleans, `1_000` and `010`
 * are integers, and a duplicate key keeps the last value. The `yaml` package defaults to 1.2 and rejects duplicate
 * keys, so version 1.1 is selected and the two places where its 1.1 mode differs from PyYAML are patched (PLAN R21).
 * contract/test/dialect.test.ts compares this loader with PyYAML on 52 tricky snippets and lists what still differs.
 */
export function loadYaml(text: string): unknown {
  return parse(text, {
    version: "1.1",
    uniqueKeys: false,
    customTags: (tags) =>
      (tags as Tag[]).map((t) => {
        if (t.tag === BOOL && t.test !== undefined)
          return { ...t, test: t.test.test("true") ? PY_TRUE : PY_FALSE };
        if (t.format === "EXP" && t.test !== undefined) return { ...t, test: PY_FLOAT_EXP };
        return t;
      }) as typeof tags,
  });
}
