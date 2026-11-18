import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";

// Spike C measurements. Run: npm run measure:spike-c (builds, serves the production build on port 5175, prints
// MEASURE lines, rewrites the screenshots in docs/spikes/). Only the fit, keyboard, visibility and task checks assert;
// the timings are printed. Timings come from one machine; each latency row repeats the load three times.
const VARIANTS = ["svg", "flow"] as const;
const shot = (variant: string, name: string): string =>
  join(import.meta.dirname, "../../../docs/spikes", `c-${variant}-${name}.png`);

async function setRange(page: Page, label: string, value: number): Promise<void> {
  // Programmatic: sets the value and dispatches `input`. Proves the wiring and the model, not thumb reach.
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
      if (state === "open") await page.locator(".handle").tap();
      await page.waitForTimeout(600);
      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        // Everything a thumb or a keyboard can reach: no exclusions. Elements inside an `inert` subtree are not reachable.
        const interactive = [
          ...document.querySelectorAll<HTMLElement>(
            "button, input, [role=button], [role=tab], a, [tabindex]",
          ),
        ].filter((el) => !el.closest("[inert]") && el.getAttribute("tabindex") !== "-1");
        const small = interactive
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44))
          .map(
            ({ el, r }) =>
              `${el.closest(".react-flow__attribution") ? "react-flow__attribution link" : el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`,
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
      // The only element allowed below 44 px is React Flow's own attribution link.
      const unexpected = report.small.filter((s) => !s.includes("react-flow__attribution"));
      expect(unexpected).toEqual([]);
      await page.screenshot({ path: shot(variant, state) });
    }
  });

  test(`keyboard: Enter and Space open the sheet, closed controls are not reachable, ${variant}`, async ({
    page,
  }) => {
    await page.goto(`/#${variant}`);
    await page.waitForSelector(".chart canvas");
    const handle = page.locator(".handle");
    const reachable = (): Promise<boolean> =>
      page
        .locator("input[type=range]")
        .first()
        .evaluate((el) => !el.closest("[inert]"));
    expect(await reachable()).toBe(false);
    await handle.focus();
    await page.keyboard.press("Enter");
    await expect(handle).toHaveAttribute("aria-expanded", "true");
    expect(await reachable()).toBe(true);
    await page.keyboard.press("Space");
    await expect(handle).toHaveAttribute("aria-expanded", "false");
    expect(await reachable()).toBe(false);
  });

  for (const height of [800, 640]) {
    test(`with the sheet open the chart and the sliders are in view together, 360 x ${height}, ${variant}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height });
      await page.goto(`/#${variant}`);
      await page.waitForSelector(".chart canvas");
      await page.locator(".handle").tap();
      await page.waitForTimeout(1200); // smooth scroll
      const box = await page.evaluate(() => {
        const rect = (selector: string) =>
          document.querySelector(selector)?.getBoundingClientRect();
        const chart = rect(".chart");
        const sheet = rect(".sheet");
        const slider = rect("input[type=range]");
        return {
          chartTop: chart?.top ?? -1,
          chartBottom: chart?.bottom ?? -1,
          sheetTop: sheet?.top ?? -1,
          sheetShare: (sheet ? sheet.height : 0) / window.innerHeight,
          sliderBottom: slider?.bottom ?? -1,
          innerHeight: window.innerHeight,
        };
      });
      console.log(`MEASURE ${JSON.stringify({ variant, height, sheetOpen: box })}`);
      expect(box.chartBottom).toBeLessThanOrEqual(box.sheetTop + 1);
      expect(box.chartTop).toBeGreaterThanOrEqual(0);
      expect(box.sliderBottom).toBeLessThanOrEqual(box.innerHeight);
      await page.screenshot({ path: shot(variant, `open-${height}`) });
    });
  }

  test(`the caching tune task (programmatic slider events), ${variant}`, async ({ page }) => {
    await page.goto(`/#${variant}`);
    await page.waitForSelector(".chart canvas");
    expect((await status(page)).db).toContain("Belum");
    await page.locator(".handle").tap();
    await setRange(page, "TTL", 600); // the lab's wrong answer: long TTL without capacity
    expect((await status(page)).db).toContain("Belum");
    await setRange(page, "Kapasitas", 20); // the reference solution
    await setRange(page, "TTL", 300);
    const done = await status(page);
    console.log(`MEASURE ${JSON.stringify({ variant, task: done })}`);
    expect(done.db).toContain("Lolos");
    expect(done.memory).toContain("Lolos");
    await setRange(page, "Kapasitas", 50);
    expect((await status(page)).memory).toContain("Belum");
  });

  test(`thumb precision by real touch taps on the slider track, ${variant}`, async ({ page }) => {
    await page.goto(`/#${variant}`);
    await page.waitForSelector(".chart canvas");
    await page.locator(".handle").tap();
    await page.waitForTimeout(800);
    const result: Record<string, { target: number; got: number; stepsOff: number }> = {};
    for (const [label, min, max, step, target] of [
      ["Kapasitas", 0, 50, 1, 20],
      ["TTL", 0, 600, 10, 300],
    ] as const) {
      const input = page.getByLabel(label, { exact: false });
      const box = (await input.boundingBox())!;
      const thumb = 16; // approximate thumb width: the track the thumb centre can travel is the box minus one thumb
      const x = box.x + thumb / 2 + ((target - min) / (max - min)) * (box.width - thumb);
      await page.touchscreen.tap(x, box.y + box.height / 2);
      const got = Number(await input.inputValue());
      result[label] = { target, got, stepsOff: Math.round(Math.abs(got - target) / step) };
    }
    console.log(`MEASURE ${JSON.stringify({ variant, thumbPrecision: result })}`);
  });

  for (const rate of [1, 4]) {
    test(`update latency and load, ${variant}, main-thread throttle x${rate}`, async ({ page }) => {
      const client = await page.context().newCDPSession(page);
      await client.send("Emulation.setCPUThrottlingRate", { rate });
      const runs: unknown[] = [];
      for (let run = 0; run < 3; run++) {
        await page.goto(`/#${variant}`);
        await page.reload();
        await page.waitForSelector(".chart canvas");
        await page.locator(".handle").tap();
        runs.push(
          await page.evaluate(async () => {
            const input = document.querySelector<HTMLInputElement>(
              "input[type=range]",
            ) as HTMLInputElement;
            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value",
            )?.set;
            const frame = (): Promise<void> =>
              new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
            const twoFrames: number[] = [];
            const sync: number[] = [];
            for (let i = 0; i < 40; i++) {
              const start = performance.now();
              setter?.call(input, String(((i * 7) % 49) + 1)); // always a new value
              input.dispatchEvent(new Event("input", { bubbles: true }));
              await Promise.resolve();
              sync.push(performance.now() - start);
              await frame();
              twoFrames.push(performance.now() - start);
            }
            const pick = (xs: number[], q: number): number => {
              const sorted = [...xs].sort((x, y) => x - y);
              return +(
                sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] as number
              ).toFixed(1);
            };
            const paints = Object.fromEntries(
              performance.getEntriesByType("paint").map((e) => [e.name, Math.round(e.startTime)]),
            );
            return {
              twoFrameP50: pick(twoFrames, 0.5),
              twoFrameP95: pick(twoFrames, 0.95),
              twoFrameMax: pick(twoFrames, 1),
              syncP95: pick(sync, 0.95),
              firstContentfulPaintMs: paints["first-contentful-paint"],
            };
          }),
        );
      }
      console.log(`MEASURE ${JSON.stringify({ variant, throttle: rate, runs })}`);
    });
  }
}
