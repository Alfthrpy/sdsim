import { expect, test } from "@playwright/test";
import type { Harness } from "../browser/protocol.ts";
import {
  runMMcCallbacks,
  runMMcProcesses,
  runTandemProcesses,
  type MMcConfig,
} from "../src/index.ts";
import { deterministicLog } from "../src/rng/log.ts";

// A3: results in a Chromium Worker equal results in Node, bit for bit. The expected values are computed
// by running the same engine code in Node inside this spec (the golden literal is pinned in
// test/oracles.test.ts), so Node and Chromium are compared on every variant below.
const GOLDEN = "093382ef";
const base: MMcConfig = { lambda: 0.8, mu: 1, servers: 2, customers: 5000, seed: 7 };
// page.evaluate callbacks run in the page, so they cannot call helpers from this file.

for (const style of ["callbacks", "processes"] as const) {
  test(`golden hash in a Chromium Worker, ${style} style`, async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(
      ([s, c]) => (globalThis as unknown as { sdsim: Harness }).sdsim.runInWorker(s, c, 0),
      [style, base] as const,
    );
    expect(result.logHash).toBe(GOLDEN);
  });
}

for (const service of ["deterministic", "erlang4", "hyper2"] as const) {
  test(`same hash in Chromium and Node, ${service} service, both styles`, async ({ page }) => {
    await page.goto("/");
    const config = { ...base, service };
    for (const [style, run] of [
      ["callbacks", runMMcCallbacks],
      ["processes", runMMcProcesses],
    ] as const) {
      const result = await page.evaluate(
        ([s, c]) => (globalThis as unknown as { sdsim: Harness }).sdsim.runInWorker(s, c, 0),
        [style, config] as const,
      );
      expect(result.logHash).toBe(run(config).logHash);
    }
  });
}

test("same hash in Chromium and Node, tandem network", async ({ page }) => {
  await page.goto("/");
  const config = { ...base, lambda: 0.7, servers: 1 };
  const result = await page.evaluate(
    ([c]) => (globalThis as unknown as { sdsim: Harness }).sdsim.runInWorker("tandem", c, 0),
    [config] as const,
  );
  expect(result.logHash).toBe(runTandemProcesses(config).logHash);
});

test("deterministicLog is bit-identical in Chromium and Node over the whole domain", async ({
  page,
}) => {
  await page.goto("/");
  let state = 12345;
  const rand = (): number => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  const inputs: number[] = [1, 0.5, 2 ** -1022, 2 ** -53, 1 - 2 ** -53];
  for (let i = 0; i < 50_000; i++)
    inputs.push(Math.min(1, (1 + rand()) * 2 ** -Math.floor(rand() * 1022)));
  const fromBrowser = await page.evaluate(
    (xs) => (globalThis as unknown as { sdsim: Harness }).sdsim.logOutputs(xs),
    inputs,
  );
  const mismatches = inputs.filter((x, i) => !Object.is(deterministicLog(x), fromBrowser[i]));
  expect(mismatches).toEqual([]);
});
