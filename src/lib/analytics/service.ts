import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { eachDay, type DateRange, type LocaleFilter } from "./dates";
import { buildSeries, summarize, withShares, type DayCount } from "./report";

const TOP_PATHS_LIMIT = 25;

// "createdAt"/"subscribedAt" are `timestamp without time zone` holding UTC.
// Tag as UTC, convert to Toronto wall time, then take the calendar date, so
// bucketing is correct across daylight-saving days. Fixed literals only —
// no user input is ever interpolated into these fragments.
const PV_DAY = Prisma.raw(`(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Toronto')::date`);
const NL_DAY = Prisma.raw(`(("subscribedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Toronto')::date`);

type DayRow = { day: string; count: number };

export async function getTrafficReport(range: DateRange, locale: LocaleFilter) {
  const localeSql =
    locale === "all" ? Prisma.empty : Prisma.sql`AND "locale" = ${locale}::"Locale"`;
  const localeWhere = locale === "all" ? {} : { locale };

  // One bounded query covers current + previous period (<= 2 * 366 rows out).
  const [dailyRows, pathRows, localeRows] = await Promise.all([
    prisma.$queryRaw<DayRow[]>(Prisma.sql`
      SELECT to_char(${PV_DAY}, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM "PageView"
      WHERE "createdAt" >= ${range.prevStart} AND "createdAt" < ${range.end} ${localeSql}
      GROUP BY 1
    `),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: range.start, lt: range.end }, ...localeWhere },
      _count: { _all: true },
      orderBy: [{ _count: { path: "desc" } }, { path: "asc" }],
      take: TOP_PATHS_LIMIT,
    }),
    prisma.pageView.groupBy({
      by: ["locale"],
      where: { createdAt: { gte: range.start, lt: range.end } },
      _count: { _all: true },
    }),
  ]);

  const series = buildSeries(dailyRows as DayCount[], range);
  const summary = summarize(series);
  const paths = withShares(
    pathRows.map((r) => ({ path: r.path, views: r._count._all })),
    summary.total,
  );
  const byLocale = { fr: 0, en: 0 };
  for (const r of localeRows) byLocale[r.locale] = r._count._all;

  return { series, summary, paths, byLocale };
}

export async function getNewsletterReport(range: DateRange) {
  const inRange = { gte: range.start, lt: range.end };
  const [activeNow, signupsInRange, stillActiveFromRange, unsubscribedInRange, dailyRows, recent] =
    await Promise.all([
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
      prisma.newsletterSubscriber.count({ where: { subscribedAt: inRange } }),
      prisma.newsletterSubscriber.count({ where: { subscribedAt: inRange, unsubscribedAt: null } }),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: inRange } }),
      prisma.$queryRaw<DayRow[]>(Prisma.sql`
        SELECT to_char(${NL_DAY}, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM "NewsletterSubscriber"
        WHERE "subscribedAt" >= ${range.start} AND "subscribedAt" < ${range.end}
        GROUP BY 1
      `),
      prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: "desc" },
        take: 20,
        select: { email: true, locale: true, subscribedAt: true, unsubscribedAt: true },
      }),
    ]);

  const counts = new Map(dailyRows.map((r) => [r.day, r.count]));
  const trend = eachDay(range.from, range.to).map((day) => ({ day, count: counts.get(day) ?? 0 }));

  return { activeNow, signupsInRange, stillActiveFromRange, unsubscribedInRange, trend, recent };
}
