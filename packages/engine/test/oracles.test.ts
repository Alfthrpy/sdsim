import { describe, expect, test } from "vitest";
import { runMMcCallbacks, runMMcProcesses, type MMcConfig, type MMcResult } from "../src/index.ts";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CUSTOMERS = 100_000;
const WARMUP = 10_000;

/** Erlang C: probability that an arriving customer waits in M/M/c. */
function erlangC(c: number, a: number): number {
  let term = 1;
  let sum = 1;
  for (let k = 1; k < c; k++) {
    term *= a / k;
    sum += term;
  }
  const last = (term * a) / c / (1 - a / c);
  return last / (sum + last);
}

/** Mean time in system for M/M/c. */
function mmcMeanSojourn(lambda: number, mu: number, c: number): number {
  const a = lambda / mu;
  return erlangC(c, a) / (c * mu - lambda) + 1 / mu;
}

function pooled(run: (config: MMcConfig) => MMcResult, base: Omit<MMcConfig, "seed">): number[] {
  const all: number[] = [];
  for (const seed of SEEDS) {
    const r = run({ ...base, customers: CUSTOMERS, seed });
    for (let i = WARMUP; i < r.sojourns.length; i++) all.push(r.sojourns[i] as number);
  }
  return all;
}

const mean = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length;
const quantile = (xs: number[], q: number): number => {
  const sorted = Float64Array.from(xs).sort();
  return sorted[Math.floor(q * (sorted.length - 1))] as number;
};

const styles = [
  ["callbacks", runMMcCallbacks],
  ["processes", runMMcProcesses],
] as const;

describe.each(styles)("M/M/c oracles, %s", (_name, run) => {
  // Tolerances from PLAN 9.1: mean within 5%, p99 within 10%, pooled over 10 fixed seeds.
  test.each([0.5, 0.8, 0.9])("M/M/1 at rho %s: mean and p99", (rho) => {
    const mu = 1;
    const lambda = rho * mu;
    const xs = pooled(run, { lambda, mu, servers: 1, customers: 0 });
    expect(Math.abs(mean(xs) / (1 / (mu - lambda)) - 1)).toBeLessThan(0.05);
    const p99 = Math.log(100) / (mu - lambda);
    expect(Math.abs(quantile(xs, 0.99) / p99 - 1)).toBeLessThan(0.1);
  });

  test("M/M/4 at rho 0.8: mean matches Erlang C", () => {
    const mu = 1;
    const lambda = 3.2;
    const xs = pooled(run, { lambda, mu, servers: 4, customers: 0 });
    expect(Math.abs(mean(xs) / mmcMeanSojourn(lambda, mu, 4) - 1)).toBeLessThan(0.05);
  });
});

describe("determinism", () => {
  const config = { lambda: 0.8, mu: 1, servers: 2, customers: 5_000 };
  test("same seed gives the same event-log hash, different seeds do not", () => {
    for (const [, run] of styles) {
      expect(run({ ...config, seed: 7 }).logHash).toBe(run({ ...config, seed: 7 }).logHash);
      expect(run({ ...config, seed: 7 }).logHash).not.toBe(run({ ...config, seed: 8 }).logHash);
    }
  });
  test("golden hash on Node (changes only with a recorded behavior change)", () => {
    expect(runMMcCallbacks({ ...config, seed: 7 }).logHash).toBe("76703e06");
    expect(runMMcProcesses({ ...config, seed: 7 }).logHash).toBe("76703e06");
  });
  test("the two styles are the same model: identical log and sojourns for the same seed", () => {
    const a = runMMcCallbacks({ ...config, seed: 7 });
    const b = runMMcProcesses({ ...config, seed: 7 });
    expect(a.logHash).toBe(b.logHash);
    expect(Array.from(a.sojourns)).toEqual(Array.from(b.sojourns));
  });
});
