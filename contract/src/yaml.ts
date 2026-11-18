import { parse, Scalar } from "yaml";

const BOOL = "tag:yaml.org,2002:bool";
const INT = "tag:yaml.org,2002:int";
const FLOAT = "tag:yaml.org,2002:float";
// PyYAML's boolean words: only these 18 spellings (the `yaml` package's YAML 1.1 mode also takes y and n).
const PY_TRUE = /^(?:yes|Yes|YES|true|True|TRUE|on|On|ON)$/;
const PY_BOOL = /^(?:yes|Yes|YES|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF)$/;
// PyYAML reads 1e3 and 1.5e3 as strings: an exponent needs a dot in the mantissa and a sign (1.0e+3), and a
// float needs a digit before the dot when it has a sign (-.5 is a string). A decimal integer has no leading zero (08).
const PY_FLOAT_EXP = /^(?:[-+]?(?:[0-9][0-9_]*)\.[0-9_]*|\.[0-9][0-9_]*)[eE][-+][0-9]+$/;
const PY_FLOAT = /^(?:[-+]?[0-9][0-9_]*\.[0-9_]*|\.[0-9][0-9_]*)$/;
const PY_INT_DECIMAL = /^[-+]?(?:0|[1-9][0-9_]*)$/;

// The `yaml` package's own expressions for the plain float and the decimal integer, recognised by their source.
const YAML_FLOAT_SOURCE = "^[-+]?(?:[0-9][0-9_]*)?\\.[0-9_]*$";
const YAML_INT_SOURCE = "^[-+]?[0-9][0-9_]*$";

type Tag = { tag?: string; format?: string; test?: RegExp; resolve?: unknown };

function pythonLike(tags: Tag[]): Tag[] {
  const out: Tag[] = [];
  let boolDone = false;
  for (const t of tags) {
    if (t.tag === BOOL) {
      // One tag for all eighteen words; the value comes from the matched word, not from the tag's own guess.
      if (!boolDone)
        out.push({ ...t, test: PY_BOOL, resolve: (str: string) => new Scalar(PY_TRUE.test(str)) });
      boolDone = true;
    } else if (t.tag === FLOAT && t.format === "EXP" && t.test !== undefined) {
      out.push({ ...t, test: PY_FLOAT_EXP });
    } else if (t.tag === FLOAT && t.format === undefined && t.test?.source === YAML_FLOAT_SOURCE) {
      out.push({ ...t, test: PY_FLOAT });
    } else if (t.tag === INT && t.format === undefined && t.test?.source === YAML_INT_SOURCE) {
      out.push({ ...t, test: PY_INT_DECIMAL });
    } else {
      out.push(t);
    }
  }
  return out;
}

/**
 * Parse YAML the way sdlab does: PyYAML reads YAML 1.1, so `yes`, `no`, `on`, `off` are booleans, `1_000` and `010`
 * are integers, and a duplicate key keeps the last value. The `yaml` package defaults to 1.2 and rejects duplicate
 * keys, so version 1.1 is selected and the places where its 1.1 mode differs from PyYAML are patched (PLAN R21): the
 * boolean words, exponent floats, signed floats without a leading digit, decimal integers with a leading zero.
 * A `%YAML` directive is rejected because it would switch the document to another schema.
 * contract/test/dialect.test.ts compares this loader with PyYAML and lists what still differs.
 */
export function loadYaml(text: string): unknown {
  if (/^%YAML/m.test(text)) throw new Error("%YAML directives are not supported in lab specs");
  return parse(text, {
    version: "1.1",
    uniqueKeys: false,
    logLevel: "error", // warnings such as an unresolved !!float tag are noise here; errors still throw
    customTags: (tags) => pythonLike(tags as Tag[]) as typeof tags,
  });
}
