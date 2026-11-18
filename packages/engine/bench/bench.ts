// Spike A throughput measurement (A4). Run: node packages/engine/bench/bench.ts
// Lives outside src/ because it reads the wall clock, which the engine must never do.
import { runMMcCallbacks, runMMcProcesses, type MMcConfig } from "../src/index.ts";

const config: MMcConfig = { lambda: 3.2, mu: 1, servers: 4, customers: 1_000_000, seed: 1 };

function measure(name: string, run: (c: MMcConfig) => { events: number }): void {
  run({ ...config, customers: 100_000 }); // warm-up for the JIT
  const rates: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const { events } = run(config);
    rates.push(events / ((performance.now() - start) / 1000));
  }
  rates.sort((a, b) => a - b);
  const m = (r: number): string => (r / 1e6).toFixed(2);
  console.log(
    `${name}: median ${m(rates[2] as number)} M events/s (min ${m(rates[0] as number)}, max ${m(rates[4] as number)})`,
  );
}

console.log(`node ${process.version}, ${config.customers} customers, M/M/4 rho 0.8`);
measure("callbacks", runMMcCallbacks);
measure("processes", runMMcProcesses);
