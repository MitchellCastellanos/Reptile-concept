import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 50;

type Status = "active" | "unsubscribed" | "all";

type Filters = { q: string; status: Status; lang?: "fr" | "en"; perPage: number; page: number };

function buildUrl(f: Filters) {
  const search = new URLSearchParams();
  if (f.q) search.set("q", f.q);
  if (f.status !== "active") search.set("status", f.status);
  if (f.lang) search.set("lang", f.lang);
  if (f.perPage !== DEFAULT_PAGE_SIZE) search.set("perPage", String(f.perPage));
  if (f.page > 1) search.set("page", String(f.page));
  const qs = search.toString();
  return qs ? `/admin/subscribers?${qs}` : "/admin/subscribers";
}

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; lang?: string; perPage?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status: Status =
    params.status === "unsubscribed" || params.status === "all" ? params.status : "active";
  const lang = params.lang === "fr" || params.lang === "en" ? params.lang : undefined;
  const requestedSize = Number(params.perPage);
  const perPage = (PAGE_SIZE_OPTIONS as readonly number[]).includes(requestedSize)
    ? requestedSize
    : DEFAULT_PAGE_SIZE;

  const where: Prisma.NewsletterSubscriberWhereInput = {};
  if (q) where.email = { contains: q, mode: "insensitive" };
  if (status === "active") where.unsubscribedAt = null;
  if (status === "unsubscribed") where.unsubscribedAt = { not: null };
  if (lang) where.locale = lang;

  const [activeTotal, unsubscribedTotal, totalCount] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.newsletterSubscriber.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where,
    orderBy: { subscribedAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
    select: { id: true, email: true, locale: true, subscribedAt: true, unsubscribedAt: true },
  });

  const filters: Filters = { q, status, lang, perPage, page };
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, totalCount);
  const hasFilters = Boolean(q || lang || status !== "active");
  const field =
    "rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Abonnés à l&apos;infolettre</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{activeTotal}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Abonnés actifs</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{unsubscribedTotal}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Désabonnés</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{activeTotal + unsubscribedTotal}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Total</p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          Rechercher un courriel
          <input type="search" name="q" defaultValue={q} placeholder="ex. nom@hotmail.com" className={field} />
        </label>
        <label className="flex flex-col gap-1">
          Statut
          <select name="status" defaultValue={status} className={field}>
            <option value="active">Actifs</option>
            <option value="unsubscribed">Désabonnés</option>
            <option value="all">Tous</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Langue
          <select name="lang" defaultValue={lang ?? ""} className={field}>
            <option value="">Toutes</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Par page
          <select name="perPage" defaultValue={String(perPage)} className={field}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background">
          Filtrer
        </button>
        {hasFilters ? (
          <Link href="/admin/subscribers" className="py-2 text-sm underline">
            Réinitialiser
          </Link>
        ) : null}
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {totalCount === 0
          ? "Aucun abonné"
          : `Affichage ${rangeStart}–${rangeEnd} sur ${totalCount} abonné${totalCount !== 1 ? "s" : ""}`}
        {q ? ` pour « ${q} »` : ""}
        {totalPages > 1 ? ` · page ${page} / ${totalPages}` : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-zinc-500 dark:border-white/10">
              <th className="py-2 font-medium">Courriel</th>
              <th className="py-2 font-medium">Langue</th>
              <th className="py-2 font-medium">Inscrit le</th>
              <th className="py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">{sub.email}</td>
                <td className="py-2 pr-4 uppercase text-zinc-500">{sub.locale}</td>
                <td className="py-2 pr-4 text-zinc-500">{sub.subscribedAt.toLocaleDateString("fr-CA")}</td>
                <td className="py-2">
                  {sub.unsubscribedAt ? (
                    <span className="text-zinc-500">
                      Désabonné le {sub.unsubscribedAt.toLocaleDateString("fr-CA")}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
                  )}
                </td>
              </tr>
            ))}
            {subscribers.length === 0 ? (
              <tr>
                <td className="py-3 text-zinc-500" colSpan={4}>
                  Aucun abonné trouvé pour ces critères.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={buildUrl({ ...filters, page: page - 1 })}
              className="rounded border border-black/20 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              ← Précédent
            </Link>
          ) : null}
          <span className="text-zinc-500">
            Page {page} sur {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildUrl({ ...filters, page: page + 1 })}
              className="rounded border border-black/20 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Suivant →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
