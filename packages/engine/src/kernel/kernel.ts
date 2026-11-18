import { EventHeap } from "./heap.ts";

/** Why `run` returned: nothing left, the time limit, or the event budget. */
export type RunStatus = "drained" | "time" | "budget";

/**
 * Event loop with a simulated clock and a streaming event-log hash. No wall clock, no randomness.
 *
 * Clock rule: `now` is the time of the last event run. `run({ untilTime })` that stops on the time
 * limit moves `now` to `untilTime` (never backwards); a run that drains leaves `now` at the last event.
 */
export class Kernel {
  #now = 0;
  #seq = 0;
  #processed = 0;
  #hash = 0x811c9dc5;
  readonly #heap = new EventHeap();
  // Per-kernel scratch for reading the bits of a double; fixed (little-endian) word order.
  readonly #timeView = new DataView(new ArrayBuffer(8));

  get now(): number {
    return this.#now;
  }

  get eventsProcessed(): number {
    return this.#processed;
  }

  /** Streaming hash of every logged record: the determinism test (engineering.md). */
  get logHash(): string {
    return (this.#hash >>> 0).toString(16).padStart(8, "0");
  }

  schedule(delay: number, run: () => void): void {
    if (!(delay >= 0 && delay < Infinity)) {
      throw new RangeError(`delay must be a finite number >= 0, got ${delay}`);
    }
    this.#heap.push(this.#now + delay, this.#seq++, run);
  }

  /** Add one record (time, type, node, request) to the event-log hash. */
  log(type: number, node: number, request: number): void {
    const view = this.#timeView;
    view.setFloat64(0, this.#now, true);
    let h = this.#hash;
    h = Math.imul(h ^ view.getUint32(0, true), 0x01000193);
    h = Math.imul(h ^ view.getUint32(4, true), 0x01000193);
    h = Math.imul(h ^ type, 0x01000193);
    h = Math.imul(h ^ node, 0x01000193);
    h = Math.imul(h ^ request, 0x01000193);
    this.#hash = h;
  }

  /** Run until the queue is empty, the clock would pass `untilTime`, or `maxEvents` were run. */
  run(limits: { untilTime?: number; maxEvents?: number } = {}): RunStatus {
    const untilTime = limits.untilTime ?? Infinity;
    const maxEvents = limits.maxEvents ?? Infinity;
    if (Number.isNaN(untilTime)) throw new RangeError("untilTime must not be NaN");
    if (!(maxEvents >= 0)) throw new RangeError(`maxEvents must be >= 0, got ${maxEvents}`);
    let ran = 0;
    for (;;) {
      const next = this.#heap.peekTime();
      if (next === undefined) return "drained";
      if (next > untilTime) {
        this.#now = Math.max(this.#now, untilTime);
        return "time";
      }
      if (ran >= maxEvents) return "budget";
      const run = this.#heap.pop() as () => void;
      this.#now = this.#heap.lastTime;
      run();
      ran++;
      this.#processed++;
    }
  }
}
