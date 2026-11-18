import { xoroshiro128plus } from "pure-rand/generator/xoroshiro128plus";

/** FNV-1a over a string, 32 bits. Used to derive a stream seed from (seed, component, purpose). */
function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

/** One independent random stream. Drawing from it never affects any other stream. */
export class RandomStream {
  readonly #rng: ReturnType<typeof xoroshiro128plus>;

  constructor(seed32: number) {
    this.#rng = xoroshiro128plus(seed32 | 0);
  }

  /** Uniform double in [0, 1), 53 random bits. */
  uniform(): number {
    const hi = this.#rng.next() >>> 5;
    const lo = this.#rng.next() >>> 6;
    return (hi * 67108864 + lo) / 9007199254740992;
  }

  /** Exponential variate with the given rate (mean 1 / rate). */
  exponential(rate: number): number {
    return -Math.log(1 - this.uniform()) / rate;
  }
}

/** The stream for one component and purpose under one run seed (PLAN 9.2). */
export function stream(seed: number, componentId: string, purpose: string): RandomStream {
  return new RandomStream(hash32(`${seed}|${componentId}|${purpose}`));
}
