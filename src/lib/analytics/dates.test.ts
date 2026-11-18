import { describe, expect, it } from "vitest";
import {
  addDays,
  diffDaysInclusive,
  eachDay,
  parseLocaleFilter,
  percentChange,
  resolveRange,
  torontoDay,
  torontoDayStart,
} from "./dates";

// 2026-11-18 15:00 UTC = 10:00 in Toronto (EST).
const NOW = Date.UTC(2026, 10, 18, 15, 0, 0);

describe("preset ranges", () => {
  it.each([
    ["7", 7, "2026-11-12"],
    ["30", 30, "2026-10-20"],
    ["90", 90, "2026-08-21"],
  ])("last %s days is inclusive of today", (range, days, from) => {
    const { range: r, error } = resolveRange({ range }, NOW);
    expect(error).toBeNull();
    expect(r.days).toBe(days);
    expect(r.from).toBe(from);
    expect(r.to).toBe("2026-11-18");
    expect(eachDay(r.from, r.to)).toHaveLength(days);
  });

  it("defaults to 30 days", () => {
    expect(resolveRange({}, NOW).range.days).toBe(30);
  });

  it("previous period is the same length, immediately before", () => {
    const { range } = resolveRange({ range: "7" }, NOW);
    expect(range.prevTo).toBe("2026-11-11");
    expect(range.prevFrom).toBe("2026-11-05");
    expect(diffDaysInclusive(range.prevFrom, range.prevTo)).toBe(7);
  });

  it("rejects unknown presets with a fallback and message", () => {
    const res = resolveRange({ range: "9999" }, NOW);
    expect(res.range.days).toBe(30);
    expect(res.error).toBeTruthy();
  });
});

describe("custom ranges", () => {
  it("accepts a valid range", () => {
    const { range, error } = resolveRange({ from: "2026-10-01", to: "2026-10-31" }, NOW);
    expect(error).toBeNull();
    expect(range.preset).toBe("custom");
    expect(range.days).toBe(31);
  });

  it("allows a single day", () => {
    const { range, error } = resolveRange({ from: "2026-10-05", to: "2026-10-05" }, NOW);
    expect(error).toBeNull();
    expect(range.days).toBe(1);
    expect(range.prevFrom).toBe("2026-10-04");
  });

  it.each([
    { from: "2026-02-30", to: "2026-03-05" }, // impossible date
    { from: "nope", to: "2026-03-05" }, // garbage
    { from: "2026-03-05" }, // missing end
    { from: "2026-03-10", to: "2026-03-05" }, // reversed
    { from: "2026-11-01", to: "2026-11-19" }, // future end (Toronto today is 11-18)
    { from: "2024-01-01", to: "2026-01-01" }, // over 366 days
  ])("rejects %j", (params) => {
    const res = resolveRange(params, NOW);
    expect(res.error).toBeTruthy();
    expect(res.range.days).toBe(30);
  });

  it("accepts exactly 366 days", () => {
    expect(resolveRange({ from: "2025-11-18", to: "2026-11-18" }, NOW).error).toBeNull();
  });
});

describe("Toronto timezone boundaries", () => {
  it("uses the Toronto day, not UTC, around midnight", () => {
    // 2026-11-18 03:30 UTC is still 22:30 on 11-17 in Toronto.
    expect(torontoDay(Date.UTC(2026, 10, 18, 3, 30))).toBe("2026-11-17");
    expect(torontoDay(Date.UTC(2026, 10, 18, 5, 0))).toBe("2026-11-18");
    // Summer (EDT, UTC-4)
    expect(torontoDay(Date.UTC(2026, 6, 1, 3, 59))).toBe("2026-06-30");
    expect(torontoDay(Date.UTC(2026, 6, 1, 4, 0))).toBe("2026-07-01");
  });

  it("day start is local midnight in UTC", () => {
    expect(torontoDayStart("2026-01-15").toISOString()).toBe("2026-01-15T05:00:00.000Z");
    expect(torontoDayStart("2026-07-15").toISOString()).toBe("2026-07-15T04:00:00.000Z");
  });

  it("resolves 'today' by Toronto date when UTC has already rolled over", () => {
    const lateEvening = Date.UTC(2026, 10, 19, 2, 0); // 21:00 on 11-18 in Toronto
    expect(resolveRange({ range: "7" }, lateEvening).range.to).toBe("2026-11-18");
  });
});

describe("daylight-saving transitions", () => {
  it("spring forward 2026-03-08: 23-hour day", () => {
    const start = torontoDayStart("2026-03-08"); // EST
    const next = torontoDayStart("2026-03-09"); // EDT
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(next.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect((next.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it("fall back 2026-11-01: 25-hour day", () => {
    const start = torontoDayStart("2026-11-01"); // EDT
    const next = torontoDayStart("2026-11-02"); // EST
    expect(start.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(next.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect((next.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("a range spanning a transition keeps the right number of calendar days", () => {
    const { range } = resolveRange({ from: "2026-10-30", to: "2026-11-03" }, NOW);
    expect(range.days).toBe(5);
    expect(range.end.toISOString()).toBe("2026-11-04T05:00:00.000Z");
    expect(eachDay(range.from, range.to)).toEqual([
      "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03",
    ]);
  });

  it("day arithmetic is unaffected by DST", () => {
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("helpers", () => {
  it("percentChange is undefined (null) when previous is zero", () => {
    expect(percentChange(50, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });
  it("parseLocaleFilter only accepts fr/en", () => {
    expect(parseLocaleFilter("fr")).toBe("fr");
    expect(parseLocaleFilter("en")).toBe("en");
    expect(parseLocaleFilter("de")).toBe("all");
    expect(parseLocaleFilter(undefined)).toBe("all");
  });
});
