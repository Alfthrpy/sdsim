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

  /** Free a server; the next waiter gets it at the same simulated time, in FIFO order. */
  release(): void {
    if (this.#head < this.#waiting.length) {
      const resume = this.#waiting[this.#head++] as () => void;
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
