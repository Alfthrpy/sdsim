import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { loadYaml, validateDescriptor } from "../src/index.ts";

interface Case {
  name: string;
  valid: boolean;
  at?: string;
  keyword?: string;
  property?: string;
  descriptor: unknown;
}

const cases = loadYaml(
  readFileSync(new URL("../fixtures/descriptors.yaml", import.meta.url), "utf8"),
) as Case[];

describe("descriptor conformance cases", () => {
  test.each(cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const verdict = validateDescriptor(c.descriptor);
    expect(verdict.valid, JSON.stringify(verdict.problems)).toBe(c.valid);
    if (!c.valid) {
      const found = verdict.problems.some(
        (p) =>
          (c.at === undefined || p.path === c.at) &&
          (c.keyword === undefined || p.keyword === c.keyword) &&
          (c.property === undefined || p.property === c.property),
      );
      expect(found, `expected ${JSON.stringify(c)} in ${JSON.stringify(verdict.problems)}`).toBe(
        true,
      );
    }
  });
});
