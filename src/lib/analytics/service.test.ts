import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveRange } from "./dates";

const m = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  pvGroupBy: vi.fn(),
  nlCount: vi.fn(),
  nlFindMany: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: m.queryRaw,
    pageView: { groupBy: m.pvGroupBy },
    newsletterSubscriber: { count: m.nlCount, findMany: m.nlFindMany },
  },
}));

import { getNewsletterReport, getTrafficReport } from "./service";

const NOW = Date.UTC(2026, 10, 18, 15, 0, 0);
const { range } = resolveRange({ range: "7" }, NOW);

beforeEach(() => Object.values(m).forEach((f) => f.mockReset()));

describe("getTrafficReport", () => {
  it("aggregates in SQL, zero-fills and applies the locale filter to chart and paths", async () => {
    m.queryRaw.mockResolvedValue([{ day: "2026-11-14", count: 8 }]);
    m.pvGroupBy
      .mockResolvedValueOnce([
        { path: "/", _count: { _all: 6 } },
        { path: "/shop", _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([
        { locale: "fr", _count: { _all: 8 } },
        { locale: "en", _count: { _all: 3 } },
      ]);

    const r = await getTrafficReport(range, "fr");

    // Raw query is parameterized, bounded by the instants, and carries the locale.
    const sql = m.queryRaw.mock.calls[0][0];
    expect(sql.values).toEqual([range.prevStart, range.end, "fr"]);
    expect(sql.strings.join("?")).toContain("America/Toronto");
    // Path grouping: filtered by range + locale, bounded.
    expect(m.pvGroupBy.mock.calls[0][0]).toMatchObject({
      where: { createdAt: { gte: range.start, lt: range.end }, locale: "fr" },
      take: 25,
    });
    // Locale breakdown ignores the locale filter.
    expect(m.pvGroupBy.mock.calls[1][0].where).toEqual({ createdAt: { gte: range.start, lt: range.end } });

    expect(r.series).toHaveLength(7);
    expect(r.summary.total).toBe(8);
    expect(r.paths.map((p) => [p.path, p.share])).toEqual([["/", 0.75], ["/shop", 0.25]]);
    expect(r.byLocale).toEqual({ fr: 8, en: 3 });
  });

  it("omits the locale condition for 'all'", async () => {
    m.queryRaw.mockResolvedValue([]);
    m.pvGroupBy.mockResolvedValue([]);
    const r = await getTrafficReport(range, "all");
    expect(m.queryRaw.mock.calls[0][0].values).toEqual([range.prevStart, range.end]);
    expect(m.pvGroupBy.mock.calls[0][0].where).toEqual({ createdAt: { gte: range.start, lt: range.end } });
    expect(r.summary).toMatchObject({ total: 0, changePct: null, peak: null });
    expect(r.paths).toEqual([]);
  });
});

describe("getNewsletterReport definitions", () => {
  it("separates period signups, still-active signups, period unsubscribes and active-today", async () => {
    m.nlCount.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      const keys = Object.keys(where).sort().join(",");
      if (keys === "unsubscribedAt" && where.unsubscribedAt === null) return 100; // active today
      if (keys === "subscribedAt") return 12; // signups in period (incl. since-unsubscribed)
      if (keys === "subscribedAt,unsubscribedAt") return 9; // signups still active
      if (keys === "unsubscribedAt") return 2; // unsubscribed in period
      return -1;
    });
    m.queryRaw.mockResolvedValue([{ day: "2026-11-13", count: 5 }]);
    m.nlFindMany.mockResolvedValue([]);

    const r = await getNewsletterReport(range);

    expect(r).toMatchObject({ activeNow: 100, signupsInRange: 12, stillActiveFromRange: 9, unsubscribedInRange: 2 });
    const wheres = m.nlCount.mock.calls.map((c) => c[0].where);
    expect(wheres).toContainEqual({ unsubscribedAt: null });
    expect(wheres).toContainEqual({ subscribedAt: { gte: range.start, lt: range.end } });
    expect(wheres).toContainEqual({ subscribedAt: { gte: range.start, lt: range.end }, unsubscribedAt: null });
    expect(wheres).toContainEqual({ unsubscribedAt: { gte: range.start, lt: range.end } });
    expect(r.trend).toHaveLength(7);
    expect(r.trend.find((t) => t.day === "2026-11-13")?.count).toBe(5);
    expect(r.trend.reduce((s, t) => s + t.count, 0)).toBe(5);
  });

  it("only selects subscriber emails for the bounded recent list (20)", async () => {
    m.nlCount.mockResolvedValue(0);
    m.queryRaw.mockResolvedValue([]);
    m.nlFindMany.mockResolvedValue([]);
    await getNewsletterReport(range);
    expect(m.nlFindMany.mock.calls[0][0]).toMatchObject({ take: 20 });
  });
});
