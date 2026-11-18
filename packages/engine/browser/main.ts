import type { MMcConfig } from "../src/index.ts";
import type { FromWorker, Harness, RunResult, Snapshot, Style, ToWorker } from "./protocol.ts";

function startWorker(): Worker {
  return new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
}

function runInWorker(style: Style, config: MMcConfig, warmup: number): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const worker = startWorker();
    worker.onerror = (e) => reject(new Error(e.message));
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      if (e.data.type === "result") {
        worker.terminate();
        resolve(e.data);
      }
    };
    worker.postMessage({ type: "run", style, config, warmup } satisfies ToWorker);
  });
}

/** One Worker per seed, all started together: the grading shape of PLAN 3.1. Returns wall time of the batch. */
async function grade(style: Style, base: Omit<MMcConfig, "seed">, seeds: number[]) {
  const start = performance.now();
  const results = await Promise.all(
    seeds.map((seed) => runInWorker(style, { ...base, seed }, Math.floor(base.customers / 10))),
  );
  return { wallMs: performance.now() - start, results };
}

/** Main-thread cost of applying snapshots: handler time (JS side, canvas calls included) and clone time. */
function snapshotBench(
  count: number,
  tokens: number,
  nodes: number,
): Promise<{ handlerMs: number[]; cloneMs: number[] }> {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  const cards = document.getElementById("nodes") as HTMLElement;
  const state = new Map<string, Snapshot["nodes"][number]>();
  const handlerMs: number[] = [];
  const cloneMs: number[] = [];
  return new Promise((resolve) => {
    const worker = startWorker();
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const message = e.data;
      if (message.type === "done") {
        worker.terminate();
        resolve({ handlerMs, cloneMs });
        return;
      }
      if (message.type !== "snapshot") return;
      const start = performance.now();
      const snapshot = message.snapshot;
      for (const node of snapshot.nodes) state.set(node.id, node);
      context.clearRect(0, 0, 360, 200);
      for (const token of snapshot.tokens) context.fillRect(token.x, token.y, 3, 3);
      cards.textContent = [...state.values()]
        .map((n) => `${n.id} q=${n.queue} u=${n.utilization.toFixed(2)} p99=${n.p99}`)
        .join(" | ");
      handlerMs.push(performance.now() - start);
      const cloneStart = performance.now();
      structuredClone(snapshot); // stands in for the deserialization the browser did before onmessage
      cloneMs.push(performance.now() - cloneStart);
    };
    worker.postMessage({
      type: "snapshots",
      count,
      intervalMs: 100,
      tokens,
      nodes,
    } satisfies ToWorker);
  });
}

const harness: Harness = { runInWorker, grade, snapshotBench };
Object.assign(window, { sdsim: harness });
