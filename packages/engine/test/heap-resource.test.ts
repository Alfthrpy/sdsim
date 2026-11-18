import { expect, test } from "vitest";
import {
  EventHeap,
  hold,
  Kernel,
  Resource,
  SimInvariantError,
  spawn,
  type Process,
} from "../src/index.ts";

test("heap returns events sorted by (time, seq) across growth, ties and interleaved pops", () => {
  const heap = new EventHeap();
  let state = 12345;
  const rand = (): number => (state = (Math.imul(state, 1103515245) + 12345) >>> 0) / 2 ** 32;
  let seq = 0;
  for (let i = 0; i < 5000; i++) {
    const time = Math.floor(rand() * 50); // many ties
    heap.push(time, seq++, () => {});
    if (i % 3 === 2) {
      heap.pop();
    }
  }
  expect(heap.size).toBeGreaterThan(1024); // the growth path ran
  const rest: Array<[number, number]> = [];
  while (heap.size > 0) {
    heap.pop();
    rest.push([heap.lastTime, 0]);
  }
  expect(rest.map((r) => r[0])).toEqual(rest.map((r) => r[0]).sort((a, b) => a - b));
});

test("equal-time events leave the heap in insertion order", () => {
  const heap = new EventHeap();
  const order: number[] = [];
  for (let i = 0; i < 3000; i++) heap.push(1, i, () => order.push(i));
  for (let i = 0; i < 3000; i++) (heap.pop() as () => void)();
  expect(order).toEqual(Array.from({ length: 3000 }, (_, i) => i));
});

test("a resource serves waiters in FIFO order and counts stuck processes", () => {
  const k = new Kernel();
  const pool = new Resource(k, 1);
  const served: number[] = [];
  function* user(id: number): Process {
    yield pool.request();
    served.push(id);
    yield hold(1);
    pool.release();
  }
  for (let i = 0; i < 5; i++) spawn(k, user(i));
  expect(pool.waiting).toBe(4);
  k.run();
  expect(served).toEqual([0, 1, 2, 3, 4]);
  expect(pool.waiting).toBe(0);
  expect(k.now).toBe(5);
});

test("a capacity-2 resource serves two at a time", () => {
  const k = new Kernel();
  const pool = new Resource(k, 2);
  const starts: number[] = [];
  function* user(): Process {
    yield pool.request();
    starts.push(k.now);
    yield hold(1);
    pool.release();
  }
  for (let i = 0; i < 4; i++) spawn(k, user());
  k.run();
  expect(starts).toEqual([0, 0, 1, 1]);
});

test("release without a request is an invariant error, bad capacity is rejected", () => {
  const k = new Kernel();
  expect(() => new Resource(k, 1).release()).toThrow(SimInvariantError);
  for (const bad of [0, -1, 1.5, Number.NaN])
    expect(() => new Resource(k, bad)).toThrow(RangeError);
});

test("a process that never releases leaves its waiters visible", () => {
  const k = new Kernel();
  const pool = new Resource(k, 1);
  function* leaky(): Process {
    yield pool.request();
  }
  for (let i = 0; i < 3; i++) spawn(k, leaky());
  expect(k.run()).toBe("drained");
  expect(pool.waiting).toBe(2);
});

test("the clock never moves backwards, whatever the limits", () => {
  const k = new Kernel();
  k.schedule(5, () => {});
  k.run({ untilTime: 3 });
  expect(k.now).toBe(3);
  k.run({ untilTime: 1 });
  expect(k.now).toBe(3);
  k.run({ untilTime: -5 });
  expect(k.now).toBe(3);
  k.run();
  expect(k.now).toBe(5);
});

test("limits and delays reject NaN, negative and infinite values", () => {
  const k = new Kernel();
  expect(() => k.run({ untilTime: Number.NaN })).toThrow(RangeError);
  expect(() => k.run({ maxEvents: Number.NaN })).toThrow(RangeError);
  expect(() => k.run({ maxEvents: -1 })).toThrow(RangeError);
  expect(() => k.schedule(Infinity, () => {})).toThrow(RangeError);
  expect(() => k.schedule(Number.NaN, () => {})).toThrow(RangeError);
});

test("events scheduled from inside events run, including zero-delay ones, and maxEvents 0 runs none", () => {
  const k = new Kernel();
  const seen: string[] = [];
  k.schedule(1, () => {
    seen.push("a");
    k.schedule(0, () => seen.push("b"));
  });
  expect(k.run({ maxEvents: 0 })).toBe("budget");
  expect(seen).toEqual([]);
  k.run();
  expect(seen).toEqual(["a", "b"]);
});
