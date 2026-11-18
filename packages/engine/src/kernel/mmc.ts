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

/** What a run of the single-station models reports. */
export interface RunSummary {
  /** Time in system (wait + service) of each customer, in order of departure. */
  sojourns: Float64Array;
  /** Integral of the number of customers in the system over time, from time 0 to `endTime`. */
  areaInSystem: number;
  /** Time of the last departure; the run starts and ends empty. */
  endTime: number;
  events: number;
  logHash: string;
}

export interface MMcResult extends RunSummary {
  /** How many customers found no free server on arrival. */
  delayed: number;
  /** Total time customers spent waiting for a server. */
  totalWait: number;
  /** Integral of the number of busy servers over time. */
  areaBusy: number;
}

/** Reject configurations that would otherwise run silently wrong (same rules for every style). */
export function checkMMcConfig(config: Omit<MMcConfig, "servers"> & { servers?: number }): void {
  const positive = (name: string, v: number): void => {
    if (!(v > 0 && v < Infinity))
      throw new RangeError(`${name} must be a positive finite number, got ${v}`);
  };
  positive("lambda", config.lambda);
  positive("mu", config.mu);
  if (!Number.isInteger(config.customers) || config.customers < 1) {
    throw new RangeError(`customers must be an integer >= 1, got ${config.customers}`);
  }
  if (config.servers !== undefined && (!Number.isInteger(config.servers) || config.servers < 1)) {
    throw new RangeError(`servers must be an integer >= 1, got ${config.servers}`);
  }
}

const ARRIVE = 1;
const DEPART = 2;

/** M/M/c written as plain callbacks (the kernel's native style). */
export function runMMcCallbacks(config: MMcConfig): MMcResult {
  checkMMcConfig(config);
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
  let totalWait = 0;
  let inSystem = 0;
  let area = 0;
  let lastChange = 0;
  let areaBusy = 0;
  let lastBusyChange = 0;

  const changeInSystem = (delta: number): void => {
    area += inSystem * (kernel.now - lastChange);
    lastChange = kernel.now;
    inSystem += delta;
  };
  const changeBusy = (delta: number): void => {
    areaBusy += busy * (kernel.now - lastBusyChange);
    lastBusyChange = kernel.now;
    busy += delta;
  };
  const startService = (id: number): void => {
    changeBusy(1);
    totalWait += kernel.now - (arrivedAt[id] as number);
    kernel.schedule(sample(), () => depart(id));
  };
  const depart = (id: number): void => {
    kernel.log(DEPART, 0, id);
    changeInSystem(-1);
    sojourns[departed++] = kernel.now - (arrivedAt[id] as number);
    changeBusy(-1);
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
    totalWait,
    areaBusy,
    areaInSystem: area,
    endTime: kernel.now,
    events: kernel.eventsProcessed,
    logHash: kernel.logHash,
  };
}
