import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAnimalCategory } from "@/lib/animal-categories";
import {
  CARE_SHEET_INCOMPLETE_WHERE,
  parseAdminListParams,
  searchWhere,
  type SortDir,
} from "@/lib/admin-catalog-listing";
import { speciesNeedsAttention } from "@/lib/admin-catalog-attention";
import { isCareSheetIncomplete } from "@/lib/species-utils";
import { isCloverPlaceholderSpeciesId } from "@/lib/admin-catalog-counts";
import { AdminCatalogAlertBanner } from "@/components/admin/admin-catalog-alert-banner";
import {
  AdminAlertRowLink,
  AdminCatalogAlertSection,
} from "@/components/admin/admin-catalog-alert-section";
import { AdminCatalogFilters } from "@/components/admin/admin-catalog-filters";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSortableTh } from "@/components/admin/admin-sortable-th";
import { deleteSpeciesAction } from "./actions";

const BASE = "/admin/species";

const SORT_KEYS = [
  "scientificName",
  "commonNameFr",
  "commonNameEn",
  "category",
  "experienceLevel",
  "careSheet",
] as const;

function orderBy(sort: string, dir: SortDir) {
  if (sort === "careSheet") return { descriptionEn: dir };
  if (sort === "experienceLevel") return { experienceLevel: dir };
  if (SORT_KEYS.includes(sort as (typeof SORT_KEYS)[number]) && sort !== "careSheet") {
    return { [sort]: dir };
  }
  return { commonNameFr: dir };
}

function listParams(searchParams: Record<string, string | string[] | undefined>) {
  const base = parseAdminListParams(searchParams);
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    ...base,
    category: get("category") || undefined,
    careSheet: get("careSheet") || undefined,
    attention: get("attention") || undefined,
  };
}

export default async function AdminSpeciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = listParams(sp);
  const { q, page, perPage, sort, dir, category, careSheet, attention } = params;

  const where = {
    NOT: { id: { startsWith: "clover-species-" } },
    ...(isAnimalCategory(category) ? { category } : {}),
    ...(careSheet === "incomplete" ? CARE_SHEET_INCOMPLETE_WHERE : {}),
    ...(careSheet === "complete"
      ? {
          AND: [
            { descriptionEn: { not: null } },
            { NOT: { descriptionEn: "" } },
            { humidity: { not: null } },
            { NOT: { humidity: "" } },
            { adultSizeEn: { not: null } },
            { NOT: { adultSizeEn: "" } },
          ],
        }
      : {}),
    ...(attention === "yes" ? CARE_SHEET_INCOMPLETE_WHERE : {}),
    ...searchWhere(["scientificName", "commonNameFr", "commonNameEn"], q),
  };

  const listParamsForLinks = {
    q,
    category,
    careSheet,
    attention,
    perPage,
    sort,
    dir,
  };

  const [alertCount, alertRows, total, species] = await Promise.all([
    prisma.species.count({
      where: { ...where, ...CARE_SHEET_INCOMPLETE_WHERE },
    }),
    prisma.species.findMany({
      where: { ...where, ...CARE_SHEET_INCOMPLETE_WHERE },
      orderBy: orderBy(sort === "default" ? "commonNameFr" : sort, dir),
      take: 50,
    }),
    prisma.species.count({ where }),
    prisma.species.findMany({
      where,
      orderBy: orderBy(sort === "default" ? "commonNameFr" : sort, dir),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Espèces</h1>
        <Link
          href="/admin/species/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouvelle espèce
        </Link>
      </div>

      <AdminCatalogAlertBanner kind="species" count={alertCount} />

      {alertCount > 0 && attention !== "yes" ? (
        <AdminCatalogAlertSection title={`Attention requise — ${alertCount} espèce(s)`}>
          {alertRows.map((s) => (
            <AdminAlertRowLink
              key={s.id}
              href={`/admin/species/${s.id}/edit`}
              primary={`${s.commonNameFr} (${s.scientificName})`}
              secondary={s.category}
              badge="Fiche incomplète"
            />
          ))}
        </AdminCatalogAlertSection>
      ) : null}

      <AdminCatalogFilters
        basePath={BASE}
        params={listParamsForLinks}
        resultCount={total}
        fields={[
          { type: "search", name: "q", label: "Recherche", placeholder: "Nom scientifique ou commun…" },
          {
            type: "select",
            name: "category",
            label: "Catégorie",
            options: [
              { value: "", label: "Toutes" },
              { value: "reptiles_snakes", label: "Serpents" },
              { value: "reptiles_geckos", label: "Geckos" },
              { value: "reptiles_lizards", label: "Lézards" },
              { value: "reptiles_turtles", label: "Tortues" },
              { value: "reptiles_other", label: "Reptiles (autres)" },
              { value: "amphibians_frogs", label: "Grenouilles" },
              { value: "amphibians_salamanders", label: "Salamandres" },
              { value: "amphibians_other", label: "Amphibiens (autres)" },
              { value: "invertebrates_arachnids", label: "Arachnides" },
              { value: "invertebrates_insects", label: "Insectes" },
              { value: "invertebrates_other", label: "Invertébrés (autres)" },
            ],
          },
          {
            type: "select",
            name: "careSheet",
            label: "Fiche de soins",
            options: [
              { value: "", label: "Toutes" },
              { value: "complete", label: "Complète" },
              { value: "incomplete", label: "Incomplète" },
            ],
          },
          {
            type: "select",
            name: "attention",
            label: "Alertes",
            options: [
              { value: "", label: "Toutes" },
              { value: "yes", label: "Uniquement alertes" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left dark:border-white/10">
              <AdminSortableTh label="Nom scientifique" sortKey="scientificName" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Nom FR" sortKey="commonNameFr" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Nom EN" sortKey="commonNameEn" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Catégorie" sortKey="category" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Niveau" sortKey="experienceLevel" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Fiche" sortKey="careSheet" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {species.map((s) => {
              const alert = speciesNeedsAttention(s);
              return (
                <tr
                  key={s.id}
                  className={`border-b border-black/5 dark:border-white/5 ${alert ? "bg-amber-50/80 dark:bg-amber-950/15" : ""}`}
                >
                  <td className="py-2 pr-3 italic">{s.scientificName}</td>
                  <td className="py-2 pr-3">{s.commonNameFr}</td>
                  <td className="py-2 pr-3">{s.commonNameEn}</td>
                  <td className="py-2 pr-3 text-xs text-black/60 dark:text-white/60">{s.category}</td>
                  <td className="py-2 pr-3">{s.experienceLevel ?? "—"}</td>
                  <td className="py-2 pr-3">
                    {isCareSheetIncomplete(s) ? (
                      <span className="text-amber-600 dark:text-amber-400">Incomplète</span>
                    ) : (
                      <span className="text-green-700 dark:text-green-500">Complète</span>
                    )}
                  </td>
                  <td className="flex gap-3 py-2">
                    <Link href={`/admin/species/${s.id}/edit`} className="underline">
                      Modifier
                    </Link>
                    {!isCloverPlaceholderSpeciesId(s.id) ? (
                      <form action={deleteSpeciesAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="text-red-600 underline dark:text-red-400">
                          Supprimer
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination basePath={BASE} params={listParamsForLinks} currentPage={page} totalPages={totalPages} />
    </div>
  );
}
