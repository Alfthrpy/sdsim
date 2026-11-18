import { test } from "@playwright/test";
import type { Harness } from "../browser/protocol.ts";

// Spike A measurements A5 (grading time) and A6 (snapshot cost). Run with `npm run measure:browser`.
// Not part of CI: wall-clock numbers are not assertions (PLAN 9.4 perf tests come later).
const SEEDS = [1, 2, 3, 4, 5];
const base = { lambda: 3.2, mu: 1, servers: 4 };
// About 5 M events per seed, the PLAN event budget: 2.0 events per customer (callbacks), 2.6 (processes).
const WORKLOAD = { callbacks: 2_500_000, processes: 1_900_000 } as const;

const median = (xs: number[]): number =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] as number;
const quantile = (xs: number[], q: number): number =>
  [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(q * xs.length))] as number;

for (const rate of [1, 4]) {
  test(`A5 grading time and A6 snapshot cost, CPU throttling x${rate}`, async ({ page }) => {
    await page.goto("/");
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate });
    const cores = await page.evaluate(() => navigator.hardwareConcurrency);
    const report: Record<string, unknown> = { throttle: rate, hardwareConcurrency: cores };

    for (const style of ["callbacks", "processes"] as const) {
      const customers = WORKLOAD[style];
      const one = await page.evaluate(
        ([s, c]) => (globalThis as unknown as { sdsim: Harness }).sdsim.runInWorker(s, c, 0),
        [style, { ...base, customers, seed: 1 }] as const,
      );
      const walls: number[] = [];
      let events = 0;
      for (let i = 0; i < 3; i++) {
        const graded = await page.evaluate(
          ([s, b, seeds]) => (globalThis as unknown as { sdsim: Harness }).sdsim.grade(s, b, seeds),
          [style, { ...base, customers }, SEEDS] as const,
        );
        walls.push(graded.wallMs);
        events = graded.results[0]?.events ?? 0;
      }
      report[style] = {
        eventsPerSeed: events,
        singleWorkerMs: Math.round(one.workerMs),
        grade5SeedsWallMs: walls.map(Math.round),
        grade5SeedsMedianMs: Math.round(median(walls)),
      };
    }

    const snap = await page.evaluate(() =>
      (globalThis as unknown as { sdsim: Harness }).sdsim.snapshotBench(50, 200, 10),
    );
    const total = snap.handlerMs.map((h: number, i: number) => h + (snap.cloneMs[i] ?? 0));
    report.snapshot = {
      count: total.length,
      handlerP50: +median(snap.handlerMs).toFixed(2),
      cloneP50: +median(snap.cloneMs).toFixed(2),
      totalP50: +median(total).toFixed(2),
      totalP95: +quantile(total, 0.95).toFixed(2),
      totalMax: +Math.max(...total).toFixed(2),
    };
    console.log("MEASURE " + JSON.stringify(report));
  });
}
