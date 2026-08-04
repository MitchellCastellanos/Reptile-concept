import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAnimalCategory } from "@/lib/animal-categories";
import {
  CARE_SHEET_INCOMPLETE_WHERE,
  parseAdminListParams,
  type SortDir,
} from "@/lib/admin-catalog-listing";
import { animalNeedsAttention } from "@/lib/admin-catalog-attention";
import { isCloverPlaceholderSpeciesId } from "@/lib/admin-catalog-counts";
import { isCareSheetIncomplete } from "@/lib/species-utils";
import { getAnimalImageUrl } from "@/lib/images";
import { AdminCatalogAlertBanner } from "@/components/admin/admin-catalog-alert-banner";
import {
  AdminAlertRowLink,
  AdminCatalogAlertSection,
} from "@/components/admin/admin-catalog-alert-section";
import { AdminCatalogFilters } from "@/components/admin/admin-catalog-filters";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSortableTh } from "@/components/admin/admin-sortable-th";
import { AdminPhotoCell } from "@/components/admin/admin-photo-cell";
import { deleteAnimalAction, updateAnimalPhotoAction } from "./actions";

const BASE_ANIMALS = "/admin/animals";

const ANIMAL_STATUSES = ["available", "sold", "reserved", "on_hold", "not_for_sale"] as const;

function animalOrderBy(sort: string, dir: SortDir) {
  if (sort === "species") return { species: { commonNameFr: dir } };
  if (sort === "price") return { priceCAD: dir };
  if (sort === "sex") return { sex: dir };
  if (sort === "morph") return { morph: dir };
  if (sort === "status") return { status: dir };
  if (sort === "createdAt") return { createdAt: dir };
  return { createdAt: "desc" as const };
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
    status: get("status") || undefined,
    attention: get("attention") || undefined,
  };
}

const ANIMAL_ATTENTION_WHERE = {
  OR: [
    { speciesId: { startsWith: "clover-species-" } },
    { species: CARE_SHEET_INCOMPLETE_WHERE },
  ],
};

export default async function AdminAnimalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = listParams(sp);
  const { q, page, perPage, sort, dir, category, status, attention } = params;

  const where = {
    ...(status && ANIMAL_STATUSES.includes(status as (typeof ANIMAL_STATUSES)[number])
      ? { status: status as (typeof ANIMAL_STATUSES)[number] }
      : {}),
    ...(isAnimalCategory(category) ? { species: { category } } : {}),
    ...(attention === "yes" ? ANIMAL_ATTENTION_WHERE : {}),
    ...(q
      ? {
          OR: [
            { morph: { contains: q, mode: "insensitive" as const } },
            { species: { commonNameFr: { contains: q, mode: "insensitive" as const } } },
            { species: { scientificName: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const listParamsForLinks = { q, category, status, attention, perPage, sort, dir };

  const [alertRows, alertCount, total, animals] = await Promise.all([
    prisma.animal.findMany({
      where: { ...where, ...ANIMAL_ATTENTION_WHERE },
      include: { species: true },
      orderBy: animalOrderBy(sort === "default" ? "createdAt" : sort, dir),
      take: 50,
    }),
    prisma.animal.count({ where: { ...where, ...ANIMAL_ATTENTION_WHERE } }),
    prisma.animal.count({ where }),
    prisma.animal.findMany({
      where,
      include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
      orderBy: animalOrderBy(sort === "default" ? "createdAt" : sort, dir),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function alertBadge(animal: (typeof alertRows)[0]) {
    if (isCloverPlaceholderSpeciesId(animal.speciesId)) return "Espèce placeholder";
    if (isCareSheetIncomplete(animal.species)) return "Fiche espèce incomplète";
    return "Attention";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Animaux</h1>
        <Link
          href="/admin/animals/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouvel animal
        </Link>
      </div>

      <AdminCatalogAlertBanner kind="animals" count={alertCount} />

      {alertCount > 0 && attention !== "yes" ? (
        <AdminCatalogAlertSection title={`Attention requise — ${alertCount} animal(aux)`}>
          {alertRows.map((a) => (
            <AdminAlertRowLink
              key={a.id}
              href={`/admin/animals/${a.id}/edit`}
              primary={a.morph}
              secondary={`${a.species.commonNameFr} · ${a.status}`}
              badge={alertBadge(a)}
            />
          ))}
        </AdminCatalogAlertSection>
      ) : null}

      <AdminCatalogFilters
        basePath={BASE_ANIMALS}
        params={listParamsForLinks}
        resultCount={total}
        fields={[
          { type: "search", name: "q", label: "Recherche", placeholder: "Morph, espèce…" },
          {
            type: "select",
            name: "status",
            label: "Statut",
            options: [
              { value: "", label: "Tous" },
              { value: "available", label: "Disponible" },
              { value: "sold", label: "Vendu" },
              { value: "reserved", label: "Réservé" },
              { value: "on_hold", label: "En attente" },
              { value: "not_for_sale", label: "Non vendu" },
            ],
          },
          {
            type: "select",
            name: "category",
            label: "Catégorie espèce",
            options: [
              { value: "", label: "Toutes" },
              { value: "reptiles_snakes", label: "Serpents" },
              { value: "reptiles_geckos", label: "Geckos" },
              { value: "reptiles_lizards", label: "Lézards" },
              { value: "reptiles_turtles", label: "Tortues" },
              { value: "reptiles_other", label: "Reptiles (autres)" },
              { value: "amphibians_frogs", label: "Grenouilles" },
              { value: "invertebrates_arachnids", label: "Arachnides" },
              { value: "invertebrates_insects", label: "Insectes" },
            ],
          },
          {
            type: "select",
            name: "attention",
            label: "Alertes",
            options: [
              { value: "", label: "Tous" },
              { value: "yes", label: "Uniquement alertes" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left dark:border-white/10">
              <th className="py-2 pr-3">Photo</th>
              <AdminSortableTh label="Espèce" sortKey="species" currentSort={sort} currentDir={dir} basePath={BASE_ANIMALS} params={listParamsForLinks} />
              <AdminSortableTh label="Morph" sortKey="morph" currentSort={sort} currentDir={dir} basePath={BASE_ANIMALS} params={listParamsForLinks} />
              <AdminSortableTh label="Sexe" sortKey="sex" currentSort={sort} currentDir={dir} basePath={BASE_ANIMALS} params={listParamsForLinks} />
              <AdminSortableTh label="Prix" sortKey="price" currentSort={sort} currentDir={dir} basePath={BASE_ANIMALS} params={listParamsForLinks} />
              <AdminSortableTh label="Statut" sortKey="status" currentSort={sort} currentDir={dir} basePath={BASE_ANIMALS} params={listParamsForLinks} />
              <AdminSortableTh label="Ajouté" sortKey="createdAt" currentSort={sort} currentDir={dir} basePath={BASE_ANIMALS} params={listParamsForLinks} />
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => {
              const alert = animalNeedsAttention(animal);
              return (
                <tr
                  key={animal.id}
                  className={`border-b border-black/5 dark:border-white/5 ${alert ? "bg-amber-50/80 dark:bg-amber-950/15" : ""}`}
                >
                  <td className="py-2 pr-3">
                    <AdminPhotoCell
                      id={animal.id}
                      currentUrl={animal.media[0]?.url ?? null}
                      defaultUrl={getAnimalImageUrl(animal.species.category)}
                      action={updateAnimalPhotoAction}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    {animal.species.commonNameFr}
                    {alert ? (
                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400" title={alertBadge(animal)}>
                        ⚠
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">{animal.morph}</td>
                  <td className="py-2 pr-3">{animal.sex}</td>
                  <td className="py-2 pr-3">{Number(animal.priceCAD)} $</td>
                  <td className="py-2 pr-3">{animal.status}</td>
                  <td className="py-2 pr-3 text-xs text-black/50">
                    {animal.createdAt.toLocaleDateString("fr-CA")}
                  </td>
                  <td className="flex gap-3 py-2">
                    <Link href={`/admin/animals/${animal.id}/edit`} className="underline">
                      Modifier
                    </Link>
                    <form action={deleteAnimalAction}>
                      <input type="hidden" name="id" value={animal.id} />
                      <button type="submit" className="text-red-600 underline dark:text-red-400">
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination basePath={BASE_ANIMALS} params={listParamsForLinks} currentPage={page} totalPages={totalPages} />
    </div>
  );
}
