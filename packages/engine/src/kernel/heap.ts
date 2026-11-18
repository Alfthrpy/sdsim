/**
 * Binary min-heap ordered by (time, seq). The sequence number makes ties deterministic.
 * Structure of arrays: no object per event, so scheduling allocates only the callback.
 */
export class EventHeap {
  #times = new Float64Array(1024);
  #seqs = new Float64Array(1024);
  #runs: Array<(() => void) | undefined> = new Array(1024);
  #size = 0;

  get size(): number {
    return this.#size;
  }

  push(time: number, seq: number, run: () => void): void {
    if (this.#size === this.#times.length) this.#grow();
    const times = this.#times;
    const seqs = this.#seqs;
    const runs = this.#runs;
    let i = this.#size++;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const pt = times[parent] as number;
      if (!(time < pt || (time === pt && seq < (seqs[parent] as number)))) break;
      times[i] = pt;
      seqs[i] = seqs[parent] as number;
      runs[i] = runs[parent];
      i = parent;
    }
    times[i] = time;
    seqs[i] = seq;
    runs[i] = run;
  }

  /** Time of the earliest event, or undefined when empty. */
  peekTime(): number | undefined {
    return this.#size === 0 ? undefined : (this.#times[0] as number);
  }

  /** Remove the earliest event and return its callback; read `lastTime` for its time. */
  pop(): (() => void) | undefined {
    if (this.#size === 0) return undefined;
    const times = this.#times;
    const seqs = this.#seqs;
    const runs = this.#runs;
    const top = runs[0];
    this.lastTime = times[0] as number;
    const n = --this.#size;
    if (n > 0) {
      const time = times[n] as number;
      const seq = seqs[n] as number;
      const run = runs[n];
      let i = 0;
      for (;;) {
        let child = 2 * i + 1;
        if (child >= n) break;
        const right = child + 1;
        if (right < n) {
          const rt = times[right] as number;
          const ct = times[child] as number;
          if (rt < ct || (rt === ct && (seqs[right] as number) < (seqs[child] as number))) {
            child = right;
          }
        }
        const ct = times[child] as number;
        if (!(ct < time || (ct === time && (seqs[child] as number) < seq))) break;
        times[i] = ct;
        seqs[i] = seqs[child] as number;
        runs[i] = runs[child];
        i = child;
      }
      times[i] = time;
      seqs[i] = seq;
      runs[i] = run;
    }
    runs[n] = undefined;
    return top;
  }

  lastTime = 0;

  #grow(): void {
    const size = this.#times.length * 2;
    const times = new Float64Array(size);
    const seqs = new Float64Array(size);
    times.set(this.#times);
    seqs.set(this.#seqs);
    this.#times = times;
    this.#seqs = seqs;
    this.#runs.length = size;
  }
}
