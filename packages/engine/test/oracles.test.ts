import { describe, expect, test } from "vitest";
import {
  serviceSampler,
  stream,
  runMMcCallbacks,
  runMMcProcesses,
  runTandemProcesses,
  type MMcConfig,
  type RunSummary,
} from "../src/index.ts";

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

function pooled(run: (config: MMcConfig) => RunSummary, base: Omit<MMcConfig, "seed">): number[] {
  const all: number[] = [];
  for (const seed of SEEDS) {
    const r = run({ ...base, customers: CUSTOMERS, seed });
    for (let i = WARMUP; i < r.sojourns.length; i++) all.push(r.sojourns[i] as number);
  }
  return all;
}

/**
 * P(T > t) for the time in system T = W + S in M/M/c: W is 0 with probability 1 - C and exponential
 * with rate a = c mu - lambda otherwise, S is exponential with rate mu, independent (needs a != mu).
 */
function mmcSojournTail(t: number, lambda: number, mu: number, c: number): number {
  const wait = erlangC(c, lambda / mu);
  const a = c * mu - lambda;
  return (
    (1 - wait) * Math.exp(-mu * t) +
    (wait * (mu * Math.exp(-a * t) - a * Math.exp(-mu * t))) / (mu - a)
  );
}

function mmcSojournQuantile(q: number, lambda: number, mu: number, c: number): number {
  let low = 0;
  let high = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (mmcSojournTail(mid, lambda, mu, c) > 1 - q) low = mid;
    else high = mid;
  }
  return low;
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
  // Tolerances from PLAN 9.1 (mean within 5%, p99 within 10%) apply to the pooled sample: 10 fixed seeds,
  // the first 10k of 100k customers dropped as warm-up. A single seed at rho 0.9 can be off by 15%.
  test.each([0.5, 0.8, 0.9])("M/M/1 at rho %s: mean and p99", (rho) => {
    const mu = 1;
    const lambda = rho * mu;
    const xs = pooled(run, { lambda, mu, servers: 1, customers: 0 });
    expect(Math.abs(mean(xs) / (1 / (mu - lambda)) - 1)).toBeLessThan(0.05);
    const p99 = Math.log(100) / (mu - lambda);
    expect(Math.abs(quantile(xs, 0.99) / p99 - 1)).toBeLessThan(0.1);
  });

  test("M/M/4 at rho 0.8: p99 matches the closed form within 10%", () => {
    const lambda = 3.2;
    const xs = pooled(run, { lambda, mu: 1, servers: 4, customers: 0 });
    expect(Math.abs(quantile(xs, 0.99) / mmcSojournQuantile(0.99, lambda, 1, 4) - 1)).toBeLessThan(
      0.1,
    );
  });

  test("M/M/4 at rho 0.8: mean matches Erlang C", () => {
    const mu = 1;
    const lambda = 3.2;
    const xs = pooled(run, { lambda, mu, servers: 4, customers: 0 });
    expect(Math.abs(mean(xs) / mmcMeanSojourn(lambda, mu, 4) - 1)).toBeLessThan(0.05);
  });
});

describe.each(styles)("M/D/1 (Pollaczek-Khinchine), %s", (_name, run) => {
  test("M/D/1 at rho 0.8: mean time in system within 5%", () => {
    const mu = 1;
    const lambda = 0.8;
    const rho = lambda / mu;
    const expected = 1 / mu + rho / (2 * mu * (1 - rho));
    const xs = pooled((c) => run({ ...c, service: "deterministic" }), {
      lambda,
      mu,
      servers: 1,
      customers: 0,
    });
    expect(Math.abs(mean(xs) / expected - 1)).toBeLessThan(0.05);
  });
});

describe.each(styles)("M/G/1 (Pollaczek-Khinchine), %s", (_name, run) => {
  // PK: W = 1/mu + lambda E[S^2] / (2 (1 - rho)), E[S^2] = (1 + cv^2) / mu^2. Pooled errors are about 1%,
  // so the gate is 3%, tighter than the 10% of PLAN 9.1, to catch a wrong distribution.
  test.each([
    ["erlang4", 0.25],
    ["hyper2", 4],
  ] as const)("service %s (cv^2 %s) at rho 0.7: mean within 10%", (service, cv2) => {
    const mu = 1;
    const lambda = 0.7;
    const expected = 1 / mu + (lambda * (1 + cv2)) / (mu * mu) / (2 * (1 - lambda / mu));
    const xs = pooled((c) => run({ ...c, service }), { lambda, mu, servers: 1, customers: 0 });
    expect(Math.abs(mean(xs) / expected - 1)).toBeLessThan(0.03);
  });
});

describe.each(styles)("M/M/4 delay probability and Little's law, %s", (_name, run) => {
  test("fraction of customers who wait matches Erlang C within 5%", () => {
    const lambda = 3.2;
    let delayed = 0;
    let total = 0;
    for (const seed of SEEDS) {
      const r = run({ lambda, mu: 1, servers: 4, customers: CUSTOMERS, seed });
      delayed += r.delayed;
      total += CUSTOMERS;
    }
    expect(Math.abs(delayed / total / erlangC(4, lambda) - 1)).toBeLessThan(0.05);
  });

  test("Little's law per boundary on a run that starts and ends empty, within 2%", () => {
    // Each side comes from different bookkeeping: time integrals of counts (n(t)) against sums over customers.
    const lambda = 3.2;
    const r = run({ lambda, mu: 1, servers: 4, customers: CUSTOMERS, seed: 1 });
    const arrivalRate = CUSTOMERS / r.endTime;
    const meanSojourn = r.sojourns.reduce((sum, x) => sum + x, 0) / CUSTOMERS;
    const lSystem = r.areaInSystem / r.endTime;
    const lBusy = r.areaBusy / r.endTime;
    const lQueue = (r.areaInSystem - r.areaBusy) / r.endTime;
    // whole system: L = lambda W (an identity of the bookkeeping, so the tolerance is tiny)
    expect(Math.abs(lSystem / (arrivalRate * meanSojourn) - 1)).toBeLessThan(1e-9);
    // queue: Lq = lambda Wq, with Wq summed from the moment each customer got a server
    expect(Math.abs(lQueue / (arrivalRate * (r.totalWait / CUSTOMERS)) - 1)).toBeLessThan(0.02);
    // servers: average busy servers = lambda / mu, which is the theory value, not the run's own sums
    expect(Math.abs(lBusy / (lambda / 1) - 1)).toBeLessThan(0.02);
  });
});

describe("tandem network (Jackson), processes", () => {
  test("three M/M/1 stations at rho 0.7: mean total time is the sum of the stations, within 5%", () => {
    const mu = 1;
    const lambda = 0.7;
    const xs = pooled((c) => runTandemProcesses(c), { lambda, mu, servers: 1, customers: 0 });
    expect(Math.abs(mean(xs) / (3 / (mu - lambda)) - 1)).toBeLessThan(0.05);
  });

  test("Little's law on the tandem: number in the network matches lambda times total time, 2%", () => {
    const r = runTandemProcesses({ lambda: 0.7, mu: 1, customers: CUSTOMERS, seed: 2 });
    const l = r.areaInSystem / r.endTime;
    const w = r.sojourns.reduce((sum, x) => sum + x, 0) / CUSTOMERS;
    expect(Math.abs(l / ((CUSTOMERS / r.endTime) * w) - 1)).toBeLessThan(0.02);
  });
});

describe("service samplers and configuration", () => {
  const moments = (kind: Parameters<typeof serviceSampler>[0]): { mean: number; cv2: number } => {
    const draw = serviceSampler(kind, 2, stream(5, "x", "service")); // mu 2: mean 0.5
    const n = 2_000_000;
    let sum = 0;
    let sumSquares = 0;
    for (let i = 0; i < n; i++) {
      const x = draw();
      sum += x;
      sumSquares += x * x;
    }
    const m = sum / n;
    return { mean: m, cv2: (sumSquares / n - m * m) / (m * m) };
  };
  test.each([
    ["exponential", 1],
    ["erlang4", 0.25],
    ["hyper2", 4],
    ["deterministic", 0],
  ] as const)("%s has mean 1/mu and cv^2 %s within 2%%", (kind, cv2) => {
    const got = moments(kind);
    expect(Math.abs(got.mean / 0.5 - 1)).toBeLessThan(0.02);
    expect(Math.abs(got.cv2 - cv2)).toBeLessThan(0.02 * Math.max(cv2, 0.1));
  });
  test("bad configurations are rejected the same way in both styles", () => {
    const ok = { lambda: 1, mu: 2, servers: 1, customers: 10, seed: 1 };
    for (const [, run] of styles) {
      for (const bad of [
        { servers: 0 },
        { customers: 0 },
        { customers: Number.NaN },
        { lambda: 0 },
        { mu: -1 },
      ]) {
        expect(() => run({ ...ok, ...bad })).toThrow(RangeError);
      }
      expect(() => run({ ...ok, service: "bogus" as never })).toThrow(RangeError);
    }
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
  test("the two styles also agree with deterministic service times", () => {
    const d = { ...config, service: "deterministic" as const, seed: 3 };
    expect(runMMcCallbacks(d).logHash).toBe(runMMcProcesses(d).logHash);
  });
  test("golden hash on Node (changes only with a recorded behavior change)", () => {
    expect(runMMcCallbacks({ ...config, seed: 7 }).logHash).toBe("093382ef");
    expect(runMMcProcesses({ ...config, seed: 7 }).logHash).toBe("093382ef");
  });
  test("the two styles are the same model: identical log and sojourns for the same seed", () => {
    const a = runMMcCallbacks({ ...config, seed: 7 });
    const b = runMMcProcesses({ ...config, seed: 7 });
    expect(a.logHash).toBe(b.logHash);
    expect(Array.from(a.sojourns)).toEqual(Array.from(b.sojourns));
  });
});
