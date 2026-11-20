import { LocalTime } from "@/components/local-time";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import {
  parseLocaleFilter,
  resolveRange,
  torontoDay,
  type LocaleFilter,
  type DateRange,
} from "@/lib/analytics/dates";
import { getNewsletterReport, getTrafficReport } from "@/lib/analytics/service";
import { formatDayLong, formatDayShort, formatDecimal, formatNumber } from "@/lib/analytics/format";
import { TrafficChart } from "@/components/admin/performance/traffic-chart";
import { TopPagesTable } from "@/components/admin/performance/top-pages-table";

type SearchParams = { range?: string; from?: string; to?: string; locale?: string };

const PRESETS = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
] as const;

const LOCALES: { value: LocaleFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

function href(range: DateRange, locale: LocaleFilter, override: { range?: string } = {}) {
  const q = new URLSearchParams();
  const preset = override.range ?? range.preset;
  if (preset === "custom") {
    q.set("from", range.from);
    q.set("to", range.to);
  } else if (preset !== "30") {
    q.set("range", preset);
  }
  if (locale !== "all") q.set("locale", locale);
  const s = q.toString();
  return s ? `/admin/performance?${s}` : "/admin/performance";
}

const pill = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${
    active
      ? "border-primary bg-primary text-white"
      : "border-border bg-card hover:border-primary/60"
  }`;

function Card({ value, label, children }: { value: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      {children}
    </div>
  );
}

function ChangeBadge({ pct, total }: { pct: number | null; total: number }) {
  if (pct === null) {
    return (
      <p className="mt-2 text-xs text-muted">
        {total > 0 ? "Nouvelle activité (aucune visite la période précédente)" : "N/D — aucune donnée de comparaison"}
      </p>
    );
  }
  const up = pct >= 0;
  return (
    <p className={`mt-2 text-xs font-medium ${up ? "text-emerald-700" : "text-red-700"}`}>
      {up ? "▲ +" : "▼ "}
      {formatDecimal(pct)} % vs période précédente
    </p>
  );
}

export default async function AdminPerformancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Defense in depth: layouts are not re-run on every client navigation, so
  // the page itself must enforce authentication before touching analytics.
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const { range, error } = resolveRange({ range: params.range, from: params.from, to: params.to });
  const locale = parseLocaleFilter(params.locale);

  const [traffic, newsletter] = await Promise.all([
    getTrafficReport(range, locale),
    getNewsletterReport(range),
  ]);
  const { summary, series, paths, byLocale } = traffic;
  const today = torontoDay();
  const periodLabel = `${formatDayShort(range.from)} → ${formatDayShort(range.to)} (${range.days} j)`;
  const localeLabel = LOCALES.find((l) => l.value === locale)!.label;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Performance du site</h1>
        <p className="mt-1 text-sm text-muted">
          Fuseau horaire : Montréal (America/Toronto). Les jours sont des jours civils complets, début et fin inclus.
        </p>
      </div>

      <section aria-label="Filtres" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Période">
          {PRESETS.map((p) => (
            <Link
              key={p.value}
              href={href(range, locale, { range: p.value })}
              className={pill(range.preset === p.value)}
              aria-current={range.preset === p.value ? "true" : undefined}
            >
              {p.label}
            </Link>
          ))}
          <span className={pill(range.preset === "custom")} aria-current={range.preset === "custom" ? "true" : undefined}>
            Personnalisée
          </span>
        </div>
        <form method="get" action="/admin/performance" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Du
            <input type="date" name="from" required defaultValue={range.from} max={today} className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Au
            <input type="date" name="to" required defaultValue={range.to} max={today} className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground" />
          </label>
          {locale !== "all" ? <input type="hidden" name="locale" value={locale} /> : null}
          <button type="submit" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/60">
            Appliquer
          </button>
          <p className="text-xs text-muted">Maximum 366 jours.</p>
        </form>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Langue des pages">
          <span className="text-sm text-muted">Langue :</span>
          {LOCALES.map((l) => (
            <Link
              key={l.value}
              href={href(range, l.value)}
              className={pill(locale === l.value)}
              aria-current={locale === l.value ? "true" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {error ? (
          <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {error}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="traffic-h" className="flex flex-col gap-4">
        <h2 id="traffic-h" className="text-lg font-medium">
          Trafic — {periodLabel} · {localeLabel}
        </h2>
        <p className="-mt-2 text-xs text-muted">
          Une « page vue » correspond à un chargement ou une navigation de page. Ce ne sont pas des visiteurs uniques :
          le site ne suit pas les visiteurs. La journée en cours est partielle.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card value={formatNumber(summary.total)} label="Pages vues (période)">
            <ChangeBadge pct={summary.changePct} total={summary.total} />
          </Card>
          <Card value={formatNumber(summary.previousTotal)} label="Pages vues (période précédente)">
            <p className="mt-2 text-xs text-muted">
              {formatDayShort(range.prevFrom)} → {formatDayShort(range.prevTo)}
            </p>
          </Card>
          <Card value={formatDecimal(summary.averagePerDay)} label="Moyenne par jour" />
          <Card
            value={summary.peak ? formatNumber(summary.peak.views) : "—"}
            label="Jour le plus achalandé"
          >
            <p className="mt-2 text-xs text-muted first-letter:uppercase">
              {summary.peak ? formatDayLong(summary.peak.day) : "Aucune visite"}
            </p>
          </Card>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <TrafficChart points={series} showPrevious={summary.previousTotal > 0} />
        </div>
        <p className="text-xs text-muted">
          Répartition par langue (toute la période, sans filtre de langue) : Français {formatNumber(byLocale.fr)} ·
          English {formatNumber(byLocale.en)}.
        </p>
      </section>

      <section aria-labelledby="pages-h">
        <h2 id="pages-h" className="mb-1 text-lg font-medium">
          Pages les plus visitées
        </h2>
        <p className="mb-3 text-xs text-muted">
          Top {paths.length > 0 ? paths.length : 25}
          {" pour la période et la langue sélectionnées. "}
          Les chemins sont regroupés sans le préfixe de langue ; « Toutes » additionne donc les versions FR et EN
          d&apos;une même page. La part est calculée sur le total des pages vues filtré.
        </p>
        <div className="rounded-lg border border-border bg-card p-4">
          <TopPagesTable rows={paths} />
        </div>
      </section>

      <section aria-labelledby="nl-h">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="nl-h" className="text-lg font-medium">Inscriptions à l&apos;infolettre</h2>
          <Link href="/admin/subscribers" className="text-sm underline">
            Voir tous les abonnés →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card value={formatNumber(newsletter.activeNow)} label="Abonnés actifs aujourd'hui">
            <p className="mt-2 text-xs text-muted">Total actuel, indépendant de la période.</p>
          </Card>
          <Card value={formatNumber(newsletter.signupsInRange)} label="Nouvelles inscriptions (période)">
            <p className="mt-2 text-xs text-muted">Premières inscriptions, y compris les désabonnés depuis.</p>
          </Card>
          <Card value={formatNumber(newsletter.stillActiveFromRange)} label="…toujours actives aujourd'hui" />
          <Card value={formatNumber(newsletter.unsubscribedInRange)} label="Désabonnements (période)" />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium">Inscriptions par jour</h3>
          <TrafficChart
            points={newsletter.trend.map((t) => ({ day: t.day, views: t.count, prevDay: t.day, prevViews: 0 }))}
            showPrevious={false}
            unit="inscriptions"
          />
        </div>

        <p className="mt-4 text-xs text-muted">
          Les 20 dernières inscriptions seulement — la liste complète, avec recherche et pages, est dans « Abonnés
          infolettre ».
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 font-medium">Courriel</th>
                <th className="py-2 font-medium">Inscrit le</th>
                <th className="py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {newsletter.recent.map((sub) => (
                <tr key={sub.email} className="border-b border-border/60">
                  <td className="py-2">{sub.email}</td>
                  <td className="py-2 text-muted"><LocalTime value={sub.subscribedAt} preset="date" /></td>
                  <td className="py-2">
                    {sub.unsubscribedAt ? (
                      <span className="text-muted">Désabonné</span>
                    ) : (
                      <span className="text-emerald-700">Actif</span>
                    )}
                  </td>
                </tr>
              ))}
              {newsletter.recent.length === 0 ? (
                <tr>
                  <td className="py-2 text-muted" colSpan={3}>Aucune inscription pour le moment.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted">
        Ce suivi est intégré à la plateforme elle-même — aucun abonnement externe requis. Aucune adresse IP ni
        identifiant de visiteur n&apos;est enregistré.
      </p>
    </div>
  );
}
