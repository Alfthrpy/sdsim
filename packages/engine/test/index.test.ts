import { expect, test } from "vitest";
import { ENGINE_PACKAGE } from "../src/index.ts";

test("toolchain runs a TypeScript test against the engine package", () => {
  expect(ENGINE_PACKAGE).toBe("@sdsim/engine");
});
