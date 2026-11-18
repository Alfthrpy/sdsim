import { Kernel } from "./kernel.ts";
import { hold, Resource, spawn, type Process } from "./process.ts";
import { serviceSampler } from "./service.ts";
import { stream } from "../rng/streams.ts";
import type { MMcConfig, MMcResult } from "./mmc.ts";

const ARRIVE = 1;
const DEPART = 2;

/** The same M/M/c, written as generator processes (ADR 0003 #2). */
export function runMMcProcesses(config: MMcConfig): MMcResult {
  const { lambda, mu, servers, customers, seed } = config;
  const kernel = new Kernel();
  const arrivals = stream(seed, "station", "arrivals");
  const sample = serviceSampler(
    config.service ?? "exponential",
    mu,
    stream(seed, "station", "service"),
  );
  const pool = new Resource(kernel, servers);
  const sojourns = new Float64Array(customers);
  let departed = 0;
  let delayed = 0;
  let inSystem = 0;
  let area = 0;
  let lastChange = 0;

  const changeInSystem = (delta: number): void => {
    area += inSystem * (kernel.now - lastChange);
    lastChange = kernel.now;
    inSystem += delta;
  };

  function* customer(id: number): Process {
    const arrivedAt = kernel.now;
    kernel.log(ARRIVE, 0, id);
    changeInSystem(1);
    yield pool.request();
    if (kernel.now > arrivedAt) delayed++; // granted later than it asked: it waited
    yield hold(sample());
    pool.release();
    kernel.log(DEPART, 0, id);
    changeInSystem(-1);
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
  return {
    sojourns,
    delayed,
    areaInSystem: area,
    endTime: kernel.now,
    events: kernel.eventsProcessed,
    logHash: kernel.logHash,
  };
}

/**
 * Three M/M/1 stations in series (Jackson network): each customer is served at station 0, then 1,
 * then 2. Written only as processes; the sojourn is the time through all three.
 */
export function runTandemProcesses(config: Omit<MMcConfig, "servers">): MMcResult {
  const { lambda, mu, customers, seed } = config;
  const kernel = new Kernel();
  const arrivals = stream(seed, "tandem", "arrivals");
  const samplers = [0, 1, 2].map((i) =>
    serviceSampler(config.service ?? "exponential", mu, stream(seed, `tandem-${i}`, "service")),
  );
  const stations = [0, 1, 2].map(() => new Resource(kernel, 1));
  const sojourns = new Float64Array(customers);
  let departed = 0;
  let inSystem = 0;
  let area = 0;
  let lastChange = 0;

  const changeInSystem = (delta: number): void => {
    area += inSystem * (kernel.now - lastChange);
    lastChange = kernel.now;
    inSystem += delta;
  };

  function* customer(id: number): Process {
    const arrivedAt = kernel.now;
    kernel.log(ARRIVE, 0, id);
    changeInSystem(1);
    for (let i = 0; i < 3; i++) {
      const station = stations[i] as Resource;
      yield station.request();
      yield hold((samplers[i] as () => number)());
      station.release();
    }
    kernel.log(DEPART, 0, id);
    changeInSystem(-1);
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
  return {
    sojourns,
    delayed: 0,
    areaInSystem: area,
    endTime: kernel.now,
    events: kernel.eventsProcessed,
    logHash: kernel.logHash,
  };
}
