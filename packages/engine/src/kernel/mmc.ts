import { Kernel } from "./kernel.ts";
import { stream } from "../rng/streams.ts";

export interface MMcConfig {
  /** Arrival rate (customers per time unit). */
  lambda: number;
  /** Service rate of one server. */
  mu: number;
  /** Number of servers. */
  servers: number;
  /** How many customers arrive in total. */
  customers: number;
  seed: number;
  /** Service-time distribution with mean 1 / mu. Default exponential. */
  service?: "exponential" | "deterministic";
}

export interface MMcResult {
  /** Time in system (wait + service) of each customer, in order of departure. */
  sojourns: Float64Array;
  events: number;
  logHash: string;
}

const ARRIVE = 1;
const DEPART = 2;

/** M/M/c written as plain callbacks (the kernel's native style). */
export function runMMcCallbacks(config: MMcConfig): MMcResult {
  const { lambda, mu, servers, customers, seed } = config;
  const deterministic = config.service === "deterministic";
  const kernel = new Kernel();
  const arrivals = stream(seed, "station", "arrivals");
  const service = stream(seed, "station", "service");
  const sojourns = new Float64Array(customers);
  const arrivedAt = new Float64Array(customers);
  const queue = new Int32Array(customers);
  let head = 0;
  let tail = 0;
  let busy = 0;
  let departed = 0;
  let next = 0;

  const startService = (id: number): void => {
    busy++;
    kernel.schedule(deterministic ? 1 / mu : service.exponential(mu), () => depart(id));
  };
  const depart = (id: number): void => {
    kernel.log(DEPART, 0, id);
    sojourns[departed++] = kernel.now - (arrivedAt[id] as number);
    busy--;
    if (head < tail) startService(queue[head++] as number);
  };
  const arrive = (): void => {
    const id = next++;
    kernel.log(ARRIVE, 0, id);
    arrivedAt[id] = kernel.now;
    if (busy < servers) startService(id);
    else queue[tail++] = id;
    if (next < customers) kernel.schedule(arrivals.exponential(lambda), arrive);
  };

  kernel.schedule(arrivals.exponential(lambda), arrive);
  kernel.run();
  return { sojourns, events: kernel.eventsProcessed, logHash: kernel.logHash };
}
