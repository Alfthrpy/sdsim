import { Kernel } from "./kernel.ts";
import { serviceSampler, type ServiceKind } from "./service.ts";
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
  service?: ServiceKind;
}

export interface MMcResult {
  /** Time in system (wait + service) of each customer, in order of departure. */
  sojourns: Float64Array;
  /** How many customers had to wait for a server. */
  delayed: number;
  /** Integral of the number of customers in the system over time, from time 0 to `endTime`. */
  areaInSystem: number;
  /** Time of the last departure; the run starts and ends empty. */
  endTime: number;
  events: number;
  logHash: string;
}

const ARRIVE = 1;
const DEPART = 2;

/** M/M/c written as plain callbacks (the kernel's native style). */
export function runMMcCallbacks(config: MMcConfig): MMcResult {
  const { lambda, mu, servers, customers, seed } = config;
  const kernel = new Kernel();
  const arrivals = stream(seed, "station", "arrivals");
  const sample = serviceSampler(
    config.service ?? "exponential",
    mu,
    stream(seed, "station", "service"),
  );
  const sojourns = new Float64Array(customers);
  const arrivedAt = new Float64Array(customers);
  const queue = new Int32Array(customers);
  let head = 0;
  let tail = 0;
  let busy = 0;
  let departed = 0;
  let next = 0;
  let delayed = 0;
  let inSystem = 0;
  let area = 0;
  let lastChange = 0;

  const changeInSystem = (delta: number): void => {
    area += inSystem * (kernel.now - lastChange);
    lastChange = kernel.now;
    inSystem += delta;
  };
  const startService = (id: number): void => {
    busy++;
    kernel.schedule(sample(), () => depart(id));
  };
  const depart = (id: number): void => {
    kernel.log(DEPART, 0, id);
    changeInSystem(-1);
    sojourns[departed++] = kernel.now - (arrivedAt[id] as number);
    busy--;
    if (head < tail) startService(queue[head++] as number);
  };
  const arrive = (): void => {
    const id = next++;
    kernel.log(ARRIVE, 0, id);
    changeInSystem(1);
    arrivedAt[id] = kernel.now;
    if (busy < servers) startService(id);
    else {
      delayed++;
      queue[tail++] = id;
    }
    if (next < customers) kernel.schedule(arrivals.exponential(lambda), arrive);
  };

  kernel.schedule(arrivals.exponential(lambda), arrive);
  kernel.run();
  return {
    sojourns,
    delayed,
    areaInSystem: area,
    endTime: kernel.now,
    events: kernel.eventsProcessed,
    logHash: kernel.logHash,
  };
}
