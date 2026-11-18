import { eachDay, percentChange, type DateRange } from "./dates";

export type DayCount = { day: string; count: number };

export type SeriesPoint = {
  day: string;
  views: number;
  /** Same-offset day of the previous period (aligned by index). */
  prevDay: string;
  prevViews: number;
};

export type TrafficSummary = {
  total: number;
  previousTotal: number;
  /** null when the previous period has no views (change is undefined). */
  changePct: number | null;
  averagePerDay: number;
  peak: { day: string; views: number } | null;
};

function toMap(rows: DayCount[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.day, (map.get(r.day) ?? 0) + r.count);
  return map;
}

/** Zero-filled daily series for the range, with the previous period aligned by index. */
export function buildSeries(rows: DayCount[], range: DateRange): SeriesPoint[] {
  const counts = toMap(rows);
  const days = eachDay(range.from, range.to);
  const prevDays = eachDay(range.prevFrom, range.prevTo);
  return days.map((day, i) => ({
    day,
    views: counts.get(day) ?? 0,
    prevDay: prevDays[i],
    prevViews: counts.get(prevDays[i]) ?? 0,
  }));
}

export function summarize(series: SeriesPoint[]): TrafficSummary {
  const total = series.reduce((s, p) => s + p.views, 0);
  const previousTotal = series.reduce((s, p) => s + p.prevViews, 0);
  let peak: TrafficSummary["peak"] = null;
  for (const p of series) {
    if (p.views > 0 && (!peak || p.views > peak.views)) peak = { day: p.day, views: p.views };
  }
  return {
    total,
    previousTotal,
    changePct: percentChange(total, previousTotal),
    averagePerDay: series.length ? total / series.length : 0,
    peak,
  };
}

export type PathRow = { path: string; views: number; share: number };

/** Adds share-of-total (0..1) to grouped path counts; sorted by views desc, then path. */
export function withShares(rows: { path: string; views: number }[], total: number): PathRow[] {
  return [...rows]
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .map((r) => ({ ...r, share: total > 0 ? r.views / total : 0 }));
}
