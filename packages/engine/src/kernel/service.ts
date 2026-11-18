import type { RandomStream } from "../rng/streams.ts";

/**
 * Service-time distributions with mean 1 / mu, built from exponential draws only (so every draw goes
 * through the deterministic logarithm). `erlang4` has cv 0.5, `hyper2` has cv 2 (balanced means).
 */
export type ServiceKind = "exponential" | "deterministic" | "erlang4" | "hyper2";

const HYPER_P = 0.5 * (1 + Math.sqrt(3 / 5)); // balanced two-phase hyperexponential, cv^2 = 4

export function serviceSampler(kind: ServiceKind, mu: number, rng: RandomStream): () => number {
  if (!(mu > 0 && mu < Infinity))
    throw new RangeError(`mu must be a positive finite number, got ${mu}`);
  switch (kind) {
    case "exponential":
      return () => rng.exponential(mu);
    case "deterministic":
      return () => 1 / mu;
    case "erlang4":
      return () =>
        rng.exponential(4 * mu) +
        rng.exponential(4 * mu) +
        rng.exponential(4 * mu) +
        rng.exponential(4 * mu);
    case "hyper2":
      return () =>
        rng.uniform() < HYPER_P
          ? rng.exponential(2 * HYPER_P * mu)
          : rng.exponential(2 * (1 - HYPER_P) * mu);
    default:
      throw new RangeError(`unknown service kind: ${String(kind)}`);
  }
}
