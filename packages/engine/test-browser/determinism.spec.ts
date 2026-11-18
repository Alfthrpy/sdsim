import { expect, test } from "@playwright/test";
import type { Harness } from "../browser/protocol.ts";

// A3: the event-log hash in Chromium (V8) equals the Node golden hash in test/oracles.test.ts.
const GOLDEN = "093382ef";
const config = { lambda: 0.8, mu: 1, servers: 2, customers: 5000, seed: 7 };

for (const style of ["callbacks", "processes"] as const) {
  test(`golden hash in a Chromium Worker, ${style} style`, async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(
      ([s, c]) => (globalThis as unknown as { sdsim: Harness }).sdsim.runInWorker(s, c, 0),
      [style, config] as const,
    );
    expect(result.logHash).toBe(GOLDEN);
  });
}
