import { expect, test } from "vitest";
import { Kernel, stream } from "../src/index.ts";

test("events at the same time run in the order they were scheduled", () => {
  const k = new Kernel();
  const order: number[] = [];
  for (let i = 0; i < 50; i++) k.schedule(1, () => order.push(i));
  k.run();
  expect(order).toEqual(Array.from({ length: 50 }, (_, i) => i));
});

test("the clock never goes backwards and time limits stop the run", () => {
  const k = new Kernel();
  const times: number[] = [];
  for (const d of [5, 1, 3, 2, 4]) k.schedule(d, () => times.push(k.now));
  expect(k.run({ untilTime: 3 })).toBe("time");
  expect(times).toEqual([1, 2, 3]);
  expect(k.run()).toBe("drained");
  expect(times).toEqual([1, 2, 3, 4, 5]);
});

test("the event budget stops the run without losing events", () => {
  const k = new Kernel();
  let count = 0;
  for (let i = 0; i < 10; i++) k.schedule(i, () => count++);
  expect(k.run({ maxEvents: 4 })).toBe("budget");
  expect(count).toBe(4);
  k.run();
  expect(count).toBe(10);
});

test("a negative delay is rejected", () => {
  expect(() => new Kernel().schedule(-1, () => {})).toThrow(RangeError);
});

test("streams are independent: drawing from one does not change another", () => {
  const a1 = stream(1, "cache", "keys");
  const first = [a1.uniform(), a1.uniform()];
  const a2 = stream(1, "cache", "keys");
  stream(1, "db", "service").uniform();
  expect([a2.uniform(), a2.uniform()]).toEqual(first);
  expect(stream(1, "cache", "keys").uniform()).not.toBe(stream(2, "cache", "keys").uniform());
});

test("stream keys with a delimiter in the component id do not collide", () => {
  expect(stream(1, "a|b", "c").uniform()).not.toBe(stream(1, "a", "b|c").uniform());
  expect(stream(1, "a:1", "x").uniform()).not.toBe(stream(1, "a", "1:x").uniform());
});

test("exponential draws have the right mean", () => {
  const s = stream(3, "x", "y");
  let sum = 0;
  const n = 200_000;
  for (let i = 0; i < n; i++) sum += s.exponential(2);
  expect(Math.abs(sum / n / 0.5 - 1)).toBeLessThan(0.01);
});

test("exponential draws have coefficient of variation 1", () => {
  const s = stream(4, "x", "y");
  const n = 200_000;
  let sum = 0;
  let sumSquares = 0;
  for (let i = 0; i < n; i++) {
    const x = s.exponential(1);
    sum += x;
    sumSquares += x * x;
  }
  const mean = sum / n;
  const cv = Math.sqrt(sumSquares / n - mean * mean) / mean;
  expect(Math.abs(cv - 1)).toBeLessThan(0.02);
});
