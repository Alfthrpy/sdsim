// The only file that touches postMessage (PLAN 9.2). It imports the engine, never the reverse.
import { runMMcCallbacks, runMMcProcesses, runTandemProcesses } from "../src/index.ts";
import type { FromWorker, Snapshot, ToWorker } from "./protocol.ts";

const scope = self as unknown as {
  postMessage(message: FromWorker): void;
  onmessage: ((event: { data: ToWorker }) => void) | null;
};

function makeSnapshot(t: number, nodes: number, tokens: number): Snapshot {
  return {
    t,
    nodes: Array.from({ length: nodes }, (_, i) => ({
      id: `node-${i}`,
      queue: (t * 7 + i) % 40,
      busy: (t + i) % 5,
      utilization: ((t * 13 + i * 17) % 100) / 100,
      p50: 10 + ((t + i) % 20),
      p99: 50 + ((t * 3 + i) % 80),
      throughput: 100 + ((t * 11 + i) % 50),
    })),
    tokens: Array.from({ length: tokens }, (_, i) => ({
      id: t * 1000 + i,
      node: i % nodes,
      x: (i * 37 + t * 5) % 360,
      y: (i * 53 + t * 3) % 200,
    })),
  };
}

scope.onmessage = (event) => {
  const message = event.data;
  if (message.type !== "run" && message.type !== "snapshots") {
    throw new TypeError(`unknown message type: ${String((message as { type?: unknown }).type)}`);
  }
  if (message.type === "run") {
    if (!(message.warmup >= 0 && message.warmup < message.config.customers)) {
      throw new RangeError("warmup must be >= 0 and < customers");
    }
    const run =
      message.style === "callbacks"
        ? runMMcCallbacks
        : message.style === "processes"
          ? runMMcProcesses
          : runTandemProcesses;
    const start = performance.now();
    const result = run(message.config);
    const workerMs = performance.now() - start;
    let sum = 0;
    for (let i = message.warmup; i < result.sojourns.length; i++)
      sum += result.sojourns[i] as number;
    scope.postMessage({
      type: "result",
      logHash: result.logHash,
      events: result.events,
      meanSojourn: sum / (result.sojourns.length - message.warmup),
      workerMs,
    });
    return;
  }
  let sent = 0;
  const tick = (): void => {
    scope.postMessage({
      type: "snapshot",
      snapshot: makeSnapshot(sent, message.nodes, message.tokens),
    });
    if (++sent < message.count) setTimeout(tick, message.intervalMs);
    else scope.postMessage({ type: "done" });
  };
  tick();
};
