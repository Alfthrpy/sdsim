const LN2 = 0.6931471805599453;
const SHIFTS = [512, 256, 128, 64, 32, 16, 8, 4, 2, 1] as const;
// Exact powers of two built by repeated doubling (no Math.pow, whose last bit is engine-defined).
const SCALES = SHIFTS.map((shift) => {
  let value = 1;
  for (let i = 0; i < shift; i++) value *= 2;
  return value;
});
const LIMITS = SCALES.map((scale) => 1 / scale);
const MIN_NORMAL = 2.2250738585072014e-308; // 2^-1022
const SQRT_HALF = 0.7071067811865476;

/**
 * Natural logarithm for 2^-1022 <= x <= 1 (normal numbers) using only +, -, *, / and exact multiplications by powers of two.
 *
 * `Math.log` is not specified to the last bit: Node 24.22 (V8 13.6) and Chromium 159 return values
 * one ulp apart for the same input, which changes the event-log hash. IEEE basic operations give the
 * same bits on every engine, so this function does too. Accuracy is about 1e-15 relative, enough
 * for sampling. The domain is what `1 - uniform()` produces; no scratch buffer, no module state.
 */
export function deterministicLog(x: number): number {
  if (!(x >= MIN_NORMAL && x <= 1)) {
    throw new RangeError(`deterministicLog needs ${MIN_NORMAL} <= x <= 1, got ${x}`);
  }
  let m = x;
  let exponent = 0;
  // Scale m into [0.5, 1) by exact powers of two (x >= 2^-1022, so these 10 steps are enough).
  for (let i = 0; i < SHIFTS.length; i++) {
    if (m < LIMITS[i]!) {
      m *= SCALES[i]!;
      exponent -= SHIFTS[i]!;
    }
  }
  // Now m in [0.5, 1). Move it to [sqrt(1/2), sqrt(2)) so that |f| <= 0.1716.
  if (m < SQRT_HALF) {
    m *= 2;
    exponent -= 1;
  }
  // ln(m) = 2 atanh(f), f = (m - 1) / (m + 1)
  const f = (m - 1) / (m + 1);
  const f2 = f * f;
  let series = 1 / 19;
  for (let j = 8; j >= 0; j--) series = series * f2 + 1 / (2 * j + 1);
  return exponent * LN2 + 2 * f * series;
}
