import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";

// Spike C measurements. Run: npm run measure:spike-c (builds, serves the production build, prints MEASURE lines,
// writes screenshots to docs/spikes/). The numbers are not assertions except the task and fit checks.
const VARIANTS = ["svg", "flow"] as const;
const shot = (variant: string, name: string): string =>
  join(import.meta.dirname, "../../../docs/spikes", `c-${variant}-${name}.png`);

async function setRange(page: Page, label: string, value: number): Promise<void> {
  await page.getByLabel(label, { exact: false }).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function status(page: Page): Promise<{ db: string; memory: string }> {
  const checks = await page.locator(".check").allInnerTexts();
  return { db: checks[0] ?? "", memory: checks[1] ?? "" };
}

for (const variant of VARIANTS) {
  test(`fit and touch targets, ${variant}`, async ({ page }) => {
    await page.goto(`/#${variant}`);
    await page.waitForSelector(".chart canvas");
    await page.waitForTimeout(500);
    for (const state of ["closed", "open"] as const) {
      if (state === "open") await page.locator(".handle").click();
      await page.waitForTimeout(400);
      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const interactive = [
          ...document.querySelectorAll<HTMLElement>(
            "button, input, [role=button], [role=tab], a, [tabindex]",
          ),
        ].filter((el) => !el.closest(".react-flow__attribution"));
        const small = interactive
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44))
          .map(
            ({ el, r }) =>
              `${el.tagName.toLowerCase()}.${el.className?.toString?.() ?? ""} ${Math.round(r.width)}x${Math.round(r.height)}`,
          );
        return {
          scrollWidth: document.documentElement.scrollWidth,
          viewport: vw,
          interactive: interactive.length,
          small,
        };
      });
      console.log(`MEASURE ${JSON.stringify({ variant, state, ...report })}`);
      expect(report.scrollWidth).toBeLessThanOrEqual(report.viewport);
      await page.screenshot({ path: shot(variant, state) });
    }
  });

  test(`the caching tune task can be finished by touch, ${variant}`, async ({ page }) => {
    await page.goto(`/#${variant}`);
    await page.waitForSelector(".chart canvas");
    expect((await status(page)).db).toContain("Belum");
    await page.locator(".handle").tap();
    // wrong answer from the lab spec: long TTL without capacity
    await setRange(page, "TTL", 600);
    expect((await status(page)).db).toContain("Belum");
    // reference solution
    await setRange(page, "Kapasitas", 20);
    await setRange(page, "TTL", 300);
    const done = await status(page);
    console.log(`MEASURE ${JSON.stringify({ variant, task: done })}`);
    expect(done.db).toContain("Lolos");
    expect(done.memory).toContain("Lolos");
    // capacity above the memory rule keeps the database green but breaks the structural rule
    await setRange(page, "Kapasitas", 50);
    expect((await status(page)).memory).toContain("Belum");
  });

  for (const rate of [1, 4]) {
    test(`update latency and load, ${variant}, main-thread throttle x${rate}`, async ({ page }) => {
      const client = await page.context().newCDPSession(page);
      await client.send("Emulation.setCPUThrottlingRate", { rate });
      await page.goto(`/#${variant}`);
      await page.waitForSelector(".chart canvas");
      await page.locator(".handle").tap();
      const result = await page.evaluate(async () => {
        const input = document.querySelector<HTMLInputElement>(
          "input[type=range]",
        ) as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        const frame = (): Promise<void> =>
          new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        const times: number[] = [];
        for (let i = 0; i < 40; i++) {
          const start = performance.now();
          setter?.call(input, String((i * 7) % 50));
          input.dispatchEvent(new Event("input", { bubbles: true }));
          await frame();
          times.push(performance.now() - start);
        }
        times.sort((a, b) => a - b);
        const paints = Object.fromEntries(
          performance.getEntriesByType("paint").map((e) => [e.name, Math.round(e.startTime)]),
        );
        const ready = performance.getEntriesByName("chart-ready")[0];
        return {
          p50: +(times[20] as number).toFixed(1),
          p95: +(times[38] as number).toFixed(1),
          max: +(times[39] as number).toFixed(1),
          paints,
          chartReadyMs: ready ? Math.round(ready.startTime) : null,
        };
      });
      console.log(`MEASURE ${JSON.stringify({ variant, throttle: rate, ...result })}`);
    });
  }
}
