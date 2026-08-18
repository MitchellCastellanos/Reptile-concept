import { prisma } from "@/lib/db";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export default async function AdminPerformancePage() {
  const now = new Date();
  const today = startOfDayUTC(now);
  const last30Start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  const prev30Start = new Date(today.getTime() - 59 * 24 * 60 * 60 * 1000);
  const last7Start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  const prev7Start = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);

  const [
    views30,
    viewsPrev30,
    views7,
    viewsPrev7,
    recentViews,
    topPathsRaw,
    newsletterActiveCount,
    newsletterLast30Count,
    newsletterRecent,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: last30Start } } }),
    prisma.pageView.count({ where: { createdAt: { gte: prev30Start, lt: last30Start } } }),
    prisma.pageView.count({ where: { createdAt: { gte: last7Start } } }),
    prisma.pageView.count({ where: { createdAt: { gte: prev7Start, lt: last7Start } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: last30Start } },
      select: { path: true, createdAt: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: last30Start } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.newsletterSubscriber.count({
      where: { subscribedAt: { gte: last30Start }, unsubscribedAt: null },
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 20,
      select: { email: true, locale: true, subscribedAt: true, unsubscribedAt: true },
    }),
  ]);

  const dailyCounts = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(last30Start.getTime() + i * 24 * 60 * 60 * 1000);
    dailyCounts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const view of recentViews) {
    const key = startOfDayUTC(view.createdAt).toISOString().slice(0, 10);
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }
  const maxDaily = Math.max(1, ...dailyCounts.values());

  function pctChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Performance du site</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{views7}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Visites — 7 derniers jours ({pctChange(views7, viewsPrev7)} vs semaine précédente)
          </p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{views30}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Visites — 30 derniers jours ({pctChange(views30, viewsPrev30)} vs mois précédent)
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Trafic quotidien (30 jours)</h2>
        <div className="flex h-32 items-end gap-0.5">
          {Array.from(dailyCounts.entries()).map(([day, count]) => (
            <div
              key={day}
              title={`${day}: ${count}`}
              className="flex-1 rounded-t bg-foreground/70"
              style={{ height: `${Math.max(2, (count / maxDaily) * 100)}%` }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Pages les plus visitées (30 jours)</h2>
        <div className="overflow-x-auto">
<table className="w-full max-w-lg border-collapse text-sm">
          <tbody>
            {topPathsRaw.map((row) => (
              <tr key={row.path} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2">{row.path}</td>
                <td className="py-2 text-right font-medium">{row._count.path}</td>
              </tr>
            ))}
            {topPathsRaw.length === 0 ? (
              <tr>
                <td className="py-2 text-zinc-500">Aucune donnée pour le moment.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
</div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Inscriptions à l&apos;infolettre</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <p className="text-2xl font-semibold">{newsletterActiveCount}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Abonnés actifs</p>
          </div>
          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <p className="text-2xl font-semibold">{newsletterLast30Count}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Nouveaux — 30 derniers jours</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-zinc-500 dark:border-white/10">
                <th className="py-2 font-medium">Courriel</th>
                <th className="py-2 font-medium">Inscrit le</th>
                <th className="py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {newsletterRecent.map((sub) => (
                <tr key={sub.email} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2">{sub.email}</td>
                  <td className="py-2 text-zinc-500">
                    {sub.subscribedAt.toLocaleDateString("fr-CA")}
                  </td>
                  <td className="py-2">
                    {sub.unsubscribedAt ? (
                      <span className="text-zinc-500">Désabonné</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
                    )}
                  </td>
                </tr>
              ))}
              {newsletterRecent.length === 0 ? (
                <tr>
                  <td className="py-2 text-zinc-500" colSpan={3}>
                    Aucune inscription pour le moment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        Ce suivi est intégré à la plateforme elle-même — aucun abonnement externe requis.
      </p>
    </div>
  );
}
