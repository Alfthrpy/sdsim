import { expect, test } from "vitest";
import { deterministicLog } from "../src/rng/log.ts";

test("deterministicLog agrees with Math.log to 1e-14 relative over the whole domain", () => {
  let state = 99;
  const rand = (): number => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let i = 0; i < 100_000; i++) {
    // mantissa in [1, 2) times a power of two from 2^-1022 up to 1
    const x = Math.min(1, (1 + rand()) * 2 ** -Math.floor(rand() * 1022));
    if (x < 2 ** -1022) continue;
    const expected = Math.log(x);
    const actual = deterministicLog(x);
    if (expected === 0) expect(actual).toBe(0);
    else expect(Math.abs(actual / expected - 1)).toBeLessThan(1e-14);
  }
  // close to 1, where ln x is tiny and relative accuracy is hardest
  for (let k = 1; k <= 52; k++) {
    const x = 1 - 2 ** -k;
    expect(Math.abs(deterministicLog(x) / Math.log(x) - 1)).toBeLessThan(1e-14);
  }
});

test("deterministicLog is exact at the easy points and monotone near 1", () => {
  expect(deterministicLog(1)).toBe(0);
  expect(Math.abs(deterministicLog(Math.exp(-1)) + 1)).toBeLessThan(1e-15);
  expect(Math.abs(deterministicLog(0.5) + Math.LN2)).toBeLessThan(1e-15);
  expect(deterministicLog(1 - 2 ** -53)).toBeLessThan(0);
  expect(deterministicLog(1 - 2 ** -53)).toBeCloseTo(-(2 ** -53), 20);
});

test("deterministicLog rejects values outside [2^-1022, 1]", () => {
  for (const bad of [0, -1, 1.5, 5e-324, Number.NaN, Infinity])
    expect(() => deterministicLog(bad)).toThrow(RangeError);
});

test("deterministicLog output bits are pinned (the same on every engine)", () => {
  // Pinned from a Node run; the Chromium spec checks the same event-log hash.
  const bits = [0.76437552301372, 0.1, 0.9999, 1e-7, 2 ** -1000, 2 ** -1022].map((x) =>
    deterministicLog(x),
  );
  expect(bits).toMatchInlineSnapshot(`
    [
      -0.2686960883038517,
      -2.3025850929940455,
      -0.00010000500033334732,
      -16.11809565095832,
      -693.1471805599452,
      -708.3964185322641,
    ]
  `);
});
