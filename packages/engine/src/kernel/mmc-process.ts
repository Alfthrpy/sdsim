import { Kernel } from "./kernel.ts";
import { hold, Resource, spawn, type Process } from "./process.ts";
import { stream } from "../rng/streams.ts";
import type { MMcConfig, MMcResult } from "./mmc.ts";

const ARRIVE = 1;
const DEPART = 2;

/** The same M/M/c, written as generator processes (ADR 0003 #2). */
export function runMMcProcesses(config: MMcConfig): MMcResult {
  const { lambda, mu, servers, customers, seed } = config;
  const deterministic = config.service === "deterministic";
  const kernel = new Kernel();
  const arrivals = stream(seed, "station", "arrivals");
  const service = stream(seed, "station", "service");
  const pool = new Resource(kernel, servers);
  const sojourns = new Float64Array(customers);
  let departed = 0;

  function* customer(id: number): Process {
    const arrivedAt = kernel.now;
    kernel.log(ARRIVE, 0, id);
    yield pool.request();
    yield hold(deterministic ? 1 / mu : service.exponential(mu));
    pool.release();
    kernel.log(DEPART, 0, id);
    sojourns[departed++] = kernel.now - arrivedAt;
  }

  function* source(): Process {
    for (let id = 0; id < customers; id++) {
      yield hold(arrivals.exponential(lambda));
      spawn(kernel, customer(id));
    }
  }

  spawn(kernel, source());
  kernel.run();
  return { sojourns, events: kernel.eventsProcessed, logHash: kernel.logHash };
}
