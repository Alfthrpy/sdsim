import type { MMcConfig } from "../src/index.ts";

export type Style = "callbacks" | "processes";

/** Messages from the page to the Worker. Spike protocol; the real one is S-020. */
export type ToWorker =
  | { type: "run"; style: Style; config: MMcConfig; warmup: number }
  | { type: "snapshots"; count: number; intervalMs: number; tokens: number; nodes: number };

/** Messages from the Worker to the page. */
export type FromWorker =
  | { type: "result"; logHash: string; events: number; meanSojourn: number; workerMs: number }
  | { type: "snapshot"; snapshot: Snapshot }
  | { type: "done" };

export interface NodeMetrics {
  id: string;
  queue: number;
  busy: number;
  utilization: number;
  p50: number;
  p99: number;
  throughput: number;
}

export interface Token {
  id: number;
  node: number;
  x: number;
  y: number;
}

/** Per-node metrics plus at most 200 sampled request tokens (PLAN 3.1). */
export interface Snapshot {
  t: number;
  nodes: NodeMetrics[];
  tokens: Token[];
}

export interface RunResult {
  logHash: string;
  events: number;
  meanSojourn: number;
  workerMs: number;
}

/** What the harness page exposes as `window.sdsim` (browser/main.ts); used by the Playwright specs. */
export interface Harness {
  runInWorker(style: Style, config: MMcConfig, warmup: number): Promise<RunResult>;
  grade(
    style: Style,
    base: Omit<MMcConfig, "seed">,
    seeds: number[],
  ): Promise<{ wallMs: number; results: RunResult[] }>;
  snapshotBench(
    count: number,
    tokens: number,
    nodes: number,
  ): Promise<{ handlerMs: number[]; cloneMs: number[] }>;
}
