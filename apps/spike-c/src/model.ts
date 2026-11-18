// Illustrative stand-in for the engine, only so the prototype reacts to edits. Not the simulator:
// a closed-form cache model (Zipf popularity, LRU as "top ranks fit", renewal TTL) plus a warm-up curve.
export interface Params {
  capacityPct: number;
  ttlS: number;
}

export const FIXED = { keys: 10_000, skew: 1, readShare: 0.9, pool: 4, readMs: 20, writeMs: 30 };
export const STEP_S = 5;
export const END_S = 600;
export const WINDOW = { from: 180, to: 600 };
export const TARGET = 0.6;
export const MEMORY_LIMIT_PCT = 25;

export const rateAt = (t: number): number => (t < 120 ? 80 : 160);

/** Steady-state hit ratio for reads at `rate` requests per second. */
export function steadyHit(p: Params, rate: number): number {
  const cached = Math.floor((p.capacityPct / 100) * FIXED.keys);
  if (cached < 1 || p.ttlS <= 0) return 0;
  let norm = 0;
  for (let k = 1; k <= FIXED.keys; k++) norm += k ** -FIXED.skew;
  let hit = 0;
  for (let k = 1; k <= cached; k++) {
    const share = k ** -FIXED.skew / norm;
    const perKey = rate * FIXED.readShare * share * p.ttlS;
    hit += share * (perKey / (1 + perKey));
  }
  return hit;
}

export interface Series {
  t: number[];
  util: number[];
  hit: number[];
}

export function simulate(p: Params): Series {
  const t: number[] = [];
  const util: number[] = [];
  const hit: number[] = [];
  const steady = [steadyHit(p, 80), steadyHit(p, 160)];
  for (let s = 0; s <= END_S; s += STEP_S) {
    const rate = rateAt(s);
    const h = (steady[rate === 80 ? 0 : 1] as number) * (1 - Math.exp(-s / 60));
    const reads = rate * FIXED.readShare * (1 - h);
    const writes = rate * (1 - FIXED.readShare);
    t.push(s);
    hit.push(h);
    util.push((reads * FIXED.readMs + writes * FIXED.writeMs) / 1000 / FIXED.pool);
  }
  return { t, util, hit };
}

export function windowMean(series: Series): number {
  let sum = 0;
  let n = 0;
  series.t.forEach((time, i) => {
    if (time >= WINDOW.from && time <= WINDOW.to) {
      sum += series.util[i] as number;
      n++;
    }
  });
  return sum / n;
}
