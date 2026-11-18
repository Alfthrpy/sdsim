// Spike A throughput measurement (A4). Run: node packages/engine/bench/bench.ts
// Lives outside src/ because it reads the wall clock, which the engine must never do.
import { Kernel, runMMcCallbacks, runMMcProcesses, type MMcConfig } from "../src/index.ts";

const config: MMcConfig = { lambda: 3.2, mu: 1, servers: 4, customers: 1_000_000, seed: 1 };

function measure(name: string, run: (c: MMcConfig) => { events: number }): void {
  run({ ...config, customers: 100_000 }); // warm-up for the JIT
  const rates: number[] = [];
  let perCustomer = 0;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const { events } = run(config);
    rates.push(events / ((performance.now() - start) / 1000));
    perCustomer = events / config.customers;
  }
  rates.sort((a, b) => a - b);
  const m = (r: number): string => (r / 1e6).toFixed(2);
  console.log(
    `${name}: ${perCustomer.toFixed(2)} events/customer, median ${m(rates[2] as number)} M events/s = ${m((rates[2] as number) / perCustomer)} M customers/s (min ${m(rates[0] as number)}, max ${m(rates[4] as number)})`,
  );
}

console.log(`node ${process.version}, ${config.customers} customers, M/M/4 rho 0.8`);
measure("callbacks", runMMcCallbacks);
measure("processes", runMMcProcesses);

// Kernel only: 1000 events always pending, each schedules its successor; no RNG, no model code.
function kernelOnly(): void {
  const total = 5_000_000;
  const rates: number[] = [];
  for (let round = 0; round < 6; round++) {
    const kernel = new Kernel();
    let scheduled = 0;
    const step = (): void => {
      if (scheduled < total) kernel.schedule(1 + (scheduled++ % 7), step);
    };
    for (let i = 0; i < 1000; i++) kernel.schedule(i % 7, step);
    const start = performance.now();
    kernel.run();
    if (round > 0) rates.push(kernel.eventsProcessed / ((performance.now() - start) / 1000));
  }
  rates.sort((a, b) => a - b);
  console.log(
    `kernel only: median ${((rates[2] as number) / 1e6).toFixed(2)} M events/s (min ${((rates[0] as number) / 1e6).toFixed(2)}, max ${((rates[4] as number) / 1e6).toFixed(2)})`,
  );
}
kernelOnly();
