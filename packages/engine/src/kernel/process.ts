import { SimInvariantError } from "./errors.ts";
import type { Kernel } from "./kernel.ts";

/** What a process can ask for: wait for simulated time, or a server of a resource. */
export type Command =
  | { readonly kind: "hold"; readonly delay: number }
  | { readonly kind: "request"; readonly resource: Resource };

export type Process = Generator<Command, void, void>;

export const hold = (delay: number): Command => ({ kind: "hold", delay });

/** A pool of identical servers with a FIFO queue. */
export class Resource {
  readonly #kernel: Kernel;
  readonly #capacity: number;
  #busy = 0;
  readonly #waiting: Array<() => void> = [];
  #head = 0;

  constructor(kernel: Kernel, capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`capacity must be an integer >= 1, got ${capacity}`);
    }
    this.#kernel = kernel;
    this.#capacity = capacity;
  }

  request = (): Command => ({ kind: "request", resource: this });

  /** Called by the runtime: take a server now or wait in line. Returns true if granted at once. */
  acquire(resume: () => void): boolean {
    if (this.#busy < this.#capacity) {
      this.#busy++;
      return true;
    }
    this.#waiting.push(resume);
    return false;
  }

  /** Servers currently granted. */
  get busy(): number {
    return this.#busy;
  }

  get capacity(): number {
    return this.#capacity;
  }

  /** Number of processes waiting for a server. Non-zero after a run means processes are stuck. */
  get waiting(): number {
    return this.#waiting.length - this.#head;
  }

  /**
   * Free a server; the next waiter gets it at the same simulated time, in FIFO order.
   * Contract: a process must release exactly once per granted request, also when it ends early;
   * a process that throws while holding a server leaks it.
   */
  release(): void {
    if (this.#busy < 1) throw new SimInvariantError("release without a granted request");
    if (this.#head < this.#waiting.length) {
      const resume = this.#waiting[this.#head] as () => void;
      this.#waiting[this.#head++] = undefined as unknown as () => void;
      if (this.#head > 1024 && this.#head * 2 > this.#waiting.length) {
        this.#waiting.splice(0, this.#head);
        this.#head = 0;
      }
      this.#kernel.schedule(0, resume);
    } else {
      this.#busy--;
    }
  }
}

/** Start a process now. It runs until its first `hold` or queued `request`. */
export function spawn(kernel: Kernel, process: Process): void {
  const step = (): void => {
    for (;;) {
      const next = process.next();
      if (next.done) return;
      const command = next.value;
      if (command.kind === "hold") {
        kernel.schedule(command.delay, step);
        return;
      }
      if (!command.resource.acquire(step)) return;
    }
  };
  step();
}
