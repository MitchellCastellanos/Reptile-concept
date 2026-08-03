import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const CUSTOMER_SORT_COLUMNS = [
  "fullName",
  "companyName",
  "phone",
  "email",
  "customerType",
] as const;
const ADDRESS_SORT_COLUMNS = ["street", "city", "province", "country", "postalCode"] as const;
const SORT_COLUMNS = [...CUSTOMER_SORT_COLUMNS, ...ADDRESS_SORT_COLUMNS] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 25;

const LANG_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
};

type CustomersUrlParams = {
  q?: string;
  lang?: string;
  sort?: string;
  dir?: string;
  page?: number;
  perPage?: number;
};

function isSortColumn(value: string | undefined): value is SortColumn {
  return SORT_COLUMNS.includes(value as SortColumn);
}

function parsePageSize(value: string | undefined): number {
  const n = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

function buildOrderBy(sort: SortColumn, dir: "asc" | "desc"): Prisma.CustomerOrderByWithRelationInput {
  if ((ADDRESS_SORT_COLUMNS as readonly string[]).includes(sort)) {
    return { addresses: { [sort]: dir } };
  }
  return { [sort]: dir };
}

function buildCustomersUrl(params: CustomersUrlParams) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.lang) search.set("lang", params.lang);
  if (params.sort) search.set("sort", params.sort);
  if (params.dir) search.set("dir", params.dir);
  if (params.perPage && params.perPage !== DEFAULT_PAGE_SIZE) {
    search.set("perPage", String(params.perPage));
  }
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/admin/customers?${qs}` : "/admin/customers";
}

function SortHeader({
  column,
  label,
  current,
}: {
  column: SortColumn;
  label: string;
  current: CustomersUrlParams;
}) {
  const isActive = current.sort === column;
  const nextDir = isActive && current.dir === "asc" ? "desc" : "asc";

  return (
    <th className="whitespace-nowrap py-2 pr-4 text-left">
      <Link
        href={buildCustomersUrl({ ...current, sort: column, dir: nextDir, page: 1 })}
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium hover:bg-black/5 dark:hover:bg-white/10"
      >
        {label}
        <span className="text-xs text-zinc-500 dark:text-zinc-400" aria-hidden>
          {isActive ? (current.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}

function cell(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lang?: string; sort?: string; dir?: string; page?: string; perPage?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const lang = params.lang === "fr" || params.lang === "en" ? params.lang : undefined;
  const sort = isSortColumn(params.sort) ? params.sort : undefined;
  const dir = params.dir === "desc" ? "desc" : "asc";
  const perPage = parsePageSize(params.perPage);

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { customerType: { contains: q, mode: "insensitive" } },
      { addresses: { some: { street: { contains: q, mode: "insensitive" } } } },
      { addresses: { some: { city: { contains: q, mode: "insensitive" } } } },
      { addresses: { some: { province: { contains: q, mode: "insensitive" } } } },
      { addresses: { some: { postalCode: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (lang) {
    where.preferredLang = lang;
  }

  const orderBy: Prisma.CustomerOrderByWithRelationInput = sort
    ? buildOrderBy(sort, dir)
    : { createdAt: "desc" };

  const totalCount = await prisma.customer.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);

  const customers = await prisma.customer.findMany({
    where,
    include: {
      addresses: { take: 1, orderBy: { id: "asc" } },
    },
    orderBy,
    skip: (page - 1) * perPage,
    take: perPage,
  });

  const filterState: CustomersUrlParams = {
    q: q || undefined,
    lang,
    sort,
    dir: sort ? dir : undefined,
    page,
    perPage,
  };
  const hasFilters = Boolean(q || lang || sort || perPage !== DEFAULT_PAGE_SIZE);

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, totalCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/admin/customers/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouveau client
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          Rechercher
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nom, entreprise, courriel, téléphone, adresse…"
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1">
          Langue
          <select
            name="lang"
            defaultValue={lang ?? ""}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            <option value="">Toutes</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Par page
          <select
            name="perPage"
            defaultValue={String(perPage)}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        {sort ? <input type="hidden" name="dir" value={dir} /> : null}
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Rechercher
        </button>
        {hasFilters ? (
          <Link href="/admin/customers" className="py-2 text-sm underline">
            Réinitialiser
          </Link>
        ) : null}
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {totalCount === 0
          ? "Aucun client"
          : `Affichage ${rangeStart}–${rangeEnd} sur ${totalCount} client${totalCount !== 1 ? "s" : ""}`}
        {q ? ` pour « ${q} »` : ""}
        {lang ? ` · ${LANG_LABELS[lang]}` : ""}
        {totalPages > 1 ? ` · page ${page} / ${totalPages}` : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left dark:border-white/10">
              <SortHeader column="fullName" label="Nom" current={filterState} />
              <SortHeader column="companyName" label="Nom de l'entreprise" current={filterState} />
              <SortHeader column="street" label="Adresse" current={filterState} />
              <SortHeader column="city" label="Ville" current={filterState} />
              <SortHeader column="province" label="Province" current={filterState} />
              <SortHeader column="country" label="Pays" current={filterState} />
              <SortHeader column="postalCode" label="Code postal" current={filterState} />
              <SortHeader column="phone" label="Téléphone" current={filterState} />
              <SortHeader column="email" label="Courriel" current={filterState} />
              <SortHeader column="customerType" label="Type de client" current={filterState} />
              <th className="whitespace-nowrap py-2" />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const address = customer.addresses[0];
              return (
                <tr key={customer.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">{cell(customer.fullName)}</td>
                  <td className="py-2 pr-4">{cell(customer.companyName)}</td>
                  <td className="py-2 pr-4">{cell(address?.street)}</td>
                  <td className="py-2 pr-4">{cell(address?.city)}</td>
                  <td className="py-2 pr-4">{cell(address?.province)}</td>
                  <td className="py-2 pr-4">{cell(address?.country)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{cell(address?.postalCode)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{cell(customer.phone)}</td>
                  <td className="py-2 pr-4">{cell(customer.email)}</td>
                  <td className="py-2 pr-4">{cell(customer.customerType)}</td>
                  <td className="py-2 whitespace-nowrap">
                    <Link href={`/admin/customers/${customer.id}`} className="underline">
                      Détails
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun client trouvé pour ces critères.</p>
      ) : null}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={buildCustomersUrl({ ...filterState, page: page - 1 })}
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
              href={buildCustomersUrl({ ...filterState, page: page + 1 })}
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
