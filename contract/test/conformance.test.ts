import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { loadYaml, validateLabSpec, type Verdict } from "../src/index.ts";

interface Case {
  name: string;
  from?: string;
  schema: "valid" | "invalid";
  at?: string;
  keyword?: string;
  property?: string;
  sdlab?: string;
  differs?: string;
  patch?: Op[];
}
interface Op {
  op: "add" | "remove" | "replace";
  path: string;
  value?: unknown;
}

const read = (name: string): string =>
  readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
const base = loadYaml(read("valid/caching-basics.yaml"));
const cases = loadYaml(read("cases.yaml")) as Case[];

type Json = Record<string, unknown> | unknown[];

/** The small RFC 6902 subset the cases use: add, remove, replace; "-" appends to a list. */
function applyPatch(doc: unknown, ops: Op[]): unknown {
  const root = structuredClone(doc) as Json;
  for (const op of ops) {
    const keys = op.path.split("/").slice(1);
    const last = keys.pop() as string;
    let parent: Json = root;
    for (const key of keys) parent = (parent as Record<string, Json>)[key] as Json;
    if (Array.isArray(parent)) {
      const index = last === "-" ? parent.length : Number(last);
      if (op.op === "remove") parent.splice(index, 1);
      else if (op.op === "add") parent.splice(index, 0, op.value);
      else parent[index] = op.value;
    } else if (op.op === "remove") {
      delete parent[last];
    } else {
      parent[last] = op.value;
    }
  }
  return root;
}

function matches(verdict: Verdict, c: Case): boolean {
  return verdict.problems.some(
    (p) =>
      (c.at === undefined || p.path === c.at) &&
      (c.keyword === undefined || p.keyword === c.keyword) &&
      (c.property === undefined || p.property === c.property),
  );
}

describe("lab spec conformance cases", () => {
  test("case names are unique and every invalid case says where it fails", () => {
    const names = cases.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of cases) {
      if (c.schema === "invalid") {
        expect(c.at, `${c.name} needs \`at\``).toBeDefined();
        expect(c.keyword, `${c.name} needs \`keyword\``).toBeDefined();
      }
    }
  });

  test.each(cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const spec = applyPatch(base, c.patch ?? []);
    const verdict = validateLabSpec(spec);
    expect(verdict.valid, JSON.stringify(verdict.problems)).toBe(c.schema === "valid");
    if (c.schema === "invalid") {
      expect(
        matches(verdict, c),
        `expected ${JSON.stringify(c)} in ${JSON.stringify(verdict.problems)}`,
      ).toBe(true);
    }
  });

  test("the cases cover each rule family: valid variants, structure, and validator-only rules", () => {
    expect(
      cases.filter((c) => c.schema === "valid" && c.sdlab === undefined).length,
    ).toBeGreaterThanOrEqual(15);
    expect(cases.filter((c) => c.schema === "invalid").length).toBeGreaterThanOrEqual(60);
    expect(cases.filter((c) => c.sdlab !== undefined).length).toBeGreaterThanOrEqual(10);
  });
});
