import { EventHeap } from "./heap.ts";

export type RunStatus = "drained" | "time" | "budget";

const timeBuffer = new Float64Array(1);
const timeWords = new Uint32Array(timeBuffer.buffer);

/** Event loop with a simulated clock and a streaming event-log hash. No wall clock, no randomness. */
export class Kernel {
  #now = 0;
  #seq = 0;
  #processed = 0;
  #hash = 0x811c9dc5;
  readonly #heap = new EventHeap();

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
    if (!(delay >= 0)) throw new RangeError(`delay must be >= 0, got ${delay}`);
    this.#heap.push(this.#now + delay, this.#seq++, run);
  }

  /** Add one record (time, type, node, request) to the event-log hash. */
  log(type: number, node: number, request: number): void {
    timeBuffer[0] = this.#now;
    let h = this.#hash;
    h = Math.imul(h ^ (timeWords[0] as number), 0x01000193);
    h = Math.imul(h ^ (timeWords[1] as number), 0x01000193);
    h = Math.imul(h ^ type, 0x01000193);
    h = Math.imul(h ^ node, 0x01000193);
    h = Math.imul(h ^ request, 0x01000193);
    this.#hash = h;
  }

  /** Run until the queue is empty, the clock would pass `untilTime`, or `maxEvents` were run. */
  run(limits: { untilTime?: number; maxEvents?: number } = {}): RunStatus {
    const untilTime = limits.untilTime ?? Infinity;
    const maxEvents = limits.maxEvents ?? Infinity;
    let ran = 0;
    for (;;) {
      const next = this.#heap.peekTime();
      if (next === undefined) return "drained";
      if (next > untilTime) {
        this.#now = untilTime;
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
