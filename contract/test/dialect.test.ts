import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";
import { loadYaml } from "../src/index.ts";

// How PyYAML (sdlab) reads each snippet, produced by fixtures/dialect/make_expected.py.
interface Tagged {
  t: string;
  v?: unknown;
}
interface Entry {
  yaml: string;
  pyyaml: Tagged;
}
const entries = JSON.parse(
  readFileSync(new URL("../fixtures/dialect/expected.json", import.meta.url), "utf8"),
) as Entry[];

function tag(value: unknown): Tagged {
  if (value === null || value === undefined) return { t: "null" };
  if (typeof value === "boolean") return { t: "bool", v: value };
  if (typeof value === "number") {
    if (Number.isNaN(value)) return { t: "float", v: "nan" };
    if (!Number.isFinite(value)) return { t: "float", v: value > 0 ? "inf" : "-inf" };
    // JSON has one number type; the snippets use a dot or an exponent for floats, so an integral value of
    // a float-looking scalar is told apart by the caller through `looksFloat`.
    return Number.isInteger(value) ? { t: "int", v: value + 0 } : { t: "float", v: value }; // + 0 turns -0 into 0
  }
  if (typeof value === "string") return { t: "str", v: value };
  if (value instanceof Date) {
    const iso = value.toISOString();
    return { t: "datetime", v: iso };
  }
  if (Array.isArray(value)) return { t: "list", v: value.map(tag) };
  return {
    t: "map",
    v: Object.fromEntries(Object.entries(value as object).map(([k, x]) => [k, tag(x)])),
  };
}

/** Snippets whose value PyYAML reads as an integral float or a date; compared after the same normalization. */
function normalize(t: Tagged): Tagged {
  if (t.t === "date" || t.t === "datetime") return { t: "date", v: String(t.v).slice(0, 10) };
  if (t.t === "float" && Number.isInteger(t.v)) return { t: "int", v: t.v };
  if (t.t === "map") {
    return {
      t: "map",
      v: Object.fromEntries(
        Object.entries(t.v as Record<string, Tagged>).map(([k, x]) => [k, normalize(x)]),
      ),
    };
  }
  if (t.t === "list") return { t: "list", v: (t.v as Tagged[]).map(normalize) };
  return t;
}

const typed = (text: string, load: (s: string) => unknown): Tagged => {
  try {
    return normalize(tag(load(text)));
  } catch {
    return { t: "error" };
  }
};

// Where the loader still differs from PyYAML, with the reason. None of these is something a lab spec contains;
// each entry is checked to still differ, so the list cannot go stale.
const KNOWN = JSON.parse(
  readFileSync(new URL("../fixtures/dialect/known-differences.json", import.meta.url), "utf8"),
) as Record<string, string>;
const KNOWN_DIFFERENCES = new Set(Object.keys(KNOWN));

describe("the TypeScript loader reads YAML like PyYAML", () => {
  test.each(
    entries
      .filter((e) => !KNOWN_DIFFERENCES.has(e.yaml))
      .map((e) => [JSON.stringify(e.yaml), e] as const),
  )("%s", (_name, entry) => {
    const got = typed(entry.yaml, loadYaml);
    const want = normalize(entry.pyyaml.t === "error" ? { t: "error" } : entry.pyyaml);
    expect(got).toEqual(want);
  });

  test("every known difference still differs, and none is missing a reason", () => {
    for (const text of KNOWN_DIFFERENCES) {
      const entry = entries.find((e) => e.yaml === text);
      expect(entry, `snippet missing for: ${JSON.stringify(text)}`).toBeDefined();
      const want = normalize((entry as Entry).pyyaml);
      expect(typed(text, loadYaml)).not.toEqual(want);
      expect((KNOWN[text] as string).length).toBeGreaterThan(20);
    }
  });

  test("expected.json was generated from the current snippets.json", () => {
    const snippets = JSON.parse(
      readFileSync(new URL("../fixtures/dialect/snippets.json", import.meta.url), "utf8"),
    ) as string[];
    expect(entries.map((e) => e.yaml)).toEqual(snippets);
  });

  test("a %YAML directive is rejected instead of switching the schema", () => {
    expect(() => loadYaml("%YAML 1.2\n---\na: yes\n")).toThrow(/%YAML/);
  });

  test("the default YAML 1.2 parser would NOT: it disagrees on the booleans and numbers sdlab sees", () => {
    const disagreements = entries.filter((e) => {
      const want = normalize(e.pyyaml.t === "error" ? { t: "error" } : e.pyyaml);
      return JSON.stringify(typed(e.yaml, (s) => parse(s))) !== JSON.stringify(want);
    });
    // Documented, not asserted case by case: yes/no/on/off, 1_000, 010, 0b101, sexagesimal, dates, duplicate keys.
    expect(disagreements.length).toBeGreaterThanOrEqual(10);
  });
});
