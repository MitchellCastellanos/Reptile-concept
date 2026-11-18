import { describe, expect, it } from "vitest";
import { resolveRange } from "./dates";
import { buildSeries, summarize, withShares } from "./report";
import { niceScale } from "./format";

const NOW = Date.UTC(2026, 10, 18, 15, 0, 0);
const { range } = resolveRange({ range: "7" }, NOW); // 11-12 .. 11-18, prev 11-05 .. 11-11

describe("buildSeries", () => {
  it("fills missing days with zero and aligns the previous period", () => {
    const series = buildSeries(
      [
        { day: "2026-11-12", count: 3 },
        { day: "2026-11-15", count: 10 },
        { day: "2026-11-05", count: 4 },
      ],
      range,
    );
    expect(series.map((p) => p.day)).toEqual([
      "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18",
    ]);
    expect(series.map((p) => p.views)).toEqual([3, 0, 0, 10, 0, 0, 0]);
    expect(series[0]).toMatchObject({ prevDay: "2026-11-05", prevViews: 4 });
    expect(series[1].prevViews).toBe(0);
  });

  it("ignores rows outside the range", () => {
    const series = buildSeries([{ day: "2020-01-01", count: 99 }], range);
    expect(summarize(series).total).toBe(0);
  });

  it("handles an empty dataset", () => {
    const series = buildSeries([], range);
    const s = summarize(series);
    expect(series).toHaveLength(7);
    expect(s).toEqual({ total: 0, previousTotal: 0, changePct: null, averagePerDay: 0, peak: null });
  });
});

describe("summarize", () => {
  it("computes totals, change, average and peak day", () => {
    const series = buildSeries(
      [
        { day: "2026-11-13", count: 7 },
        { day: "2026-11-14", count: 14 },
        { day: "2026-11-06", count: 10 },
      ],
      range,
    );
    const s = summarize(series);
    expect(s.total).toBe(21);
    expect(s.previousTotal).toBe(10);
    expect(s.changePct).toBeCloseTo(110, 5);
    expect(s.averagePerDay).toBe(3);
    expect(s.peak).toEqual({ day: "2026-11-14", views: 14 });
  });

  it("previous period of zero gives no percentage (never +100%)", () => {
    const s = summarize(buildSeries([{ day: "2026-11-13", count: 5 }], range));
    expect(s.previousTotal).toBe(0);
    expect(s.changePct).toBeNull();
  });

  it("peak tie resolves to the earliest day", () => {
    const s = summarize(
      buildSeries([{ day: "2026-11-13", count: 5 }, { day: "2026-11-16", count: 5 }], range),
    );
    expect(s.peak?.day).toBe("2026-11-13");
  });
});

describe("path aggregation", () => {
  it("computes shares of the filtered total and sorts by views then path", () => {
    const rows = withShares(
      [
        { path: "/b", views: 10 },
        { path: "/a", views: 10 },
        { path: "/", views: 30 },
      ],
      100,
    );
    expect(rows.map((r) => r.path)).toEqual(["/", "/a", "/b"]);
    expect(rows[0].share).toBe(0.3);
  });
  it("share is 0 when the total is 0", () => {
    expect(withShares([{ path: "/", views: 0 }], 0)[0].share).toBe(0);
  });
});

describe("niceScale", () => {
  it("returns rounded ticks that cover the max", () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
    const s = niceScale(87);
    expect(s.max).toBeGreaterThanOrEqual(87);
    expect(s.ticks[0]).toBe(0);
    expect(s.ticks.at(-1)).toBe(s.max);
  });
});
