import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { AnimalCard } from "@/components/animal-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { GroupedCategoryButtonGrid } from "@/components/grouped-category-button-grid";
import { ListingScrollAnchor } from "@/components/listing-scroll-anchor";
import { ListingToolbar } from "@/components/listing-toolbar";
import { Pagination } from "@/components/pagination";
import {
  ANIMAL_CATEGORY_GROUPS,
  ANIMAL_CATEGORY_ICON,
  animalCategoryGroup,
  getAvailableAnimals,
  getWishlistedIds,
  isAnimalCategory,
  isAnimalCategoryGroup,
} from "@/lib/queries";
import { parsePageNumber, parsePageSize } from "@/lib/listing";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getAnimalRatings } from "@/lib/ratings";

export default async function AnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string; perPage?: string }>;
}) {
  const { category, sort, page: pageParam, perPage: perPageParam } = await searchParams;
  const t = await getTranslations("Home");
  const tAnimal = await getTranslations("Animal");
  const tListing = await getTranslations("Listing");
  const tCategories = await getTranslations("NavCategories");
  const locale = await getLocale();
  const page = parsePageNumber(pageParam);
  const pageSize = parsePageSize(perPageParam);
  const { items: animals, total } = await getAvailableAnimals(category, sort, { page, pageSize });
  const totalPages = Math.ceil(total / pageSize);
  const customer = await getCurrentCustomer();
  const { animalIds } = await getWishlistedIds(customer?.id);
  const ratings = await getAnimalRatings(animals.map((a) => a.id));

  const activeCategory = isAnimalCategory(category) ? category : undefined;
  const activeGroupOnly = !activeCategory && isAnimalCategoryGroup(category) ? category : undefined;
  const activeGroup = activeCategory ? animalCategoryGroup(activeCategory) : activeGroupOnly;

  const navSections = ANIMAL_CATEGORY_GROUPS.map((group) => ({
    groupKey: group.key,
    groupLabel: tCategories(group.key),
    items: group.categories.map((value) => ({
      value,
      label: tCategories(value),
      image: ANIMAL_CATEGORY_ICON[value],
    })),
  }));

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (perPageParam) params.set("perPage", perPageParam);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/animals?${query}` : "/animals";
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: t("availableAnimals"), href: activeGroup ? "/animals" : undefined },
            ...(activeGroup
              ? [
                  {
                    label: tCategories(activeGroup),
                    href: activeCategory ? `/animals?category=${activeGroup}` : undefined,
                  },
                ]
              : []),
            ...(activeCategory ? [{ label: tCategories(activeCategory) }] : []),
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {activeCategory ? tCategories(activeCategory) : activeGroup ? tCategories(activeGroup) : t("availableAnimals")}
          </h1>
          <p className="mt-2 text-muted">{t("animalsSubtitle")}</p>
        </div>
      </div>

      <GroupedCategoryButtonGrid
        allLabel={tListing("allAnimals")}
        activeValue={activeCategory ?? activeGroupOnly}
        sections={navSections}
      />

      <ListingToolbar resultCount={total} />

      <ListingScrollAnchor />

      <p className="rounded-xl border border-border bg-accent-light px-4 py-3 text-sm text-foreground/80">
        {tAnimal("researchDisclaimer")}
      </p>

      {animals.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Image src="/images/animal-placeholder.png" alt="" width={160} height={120} className="h-28 w-auto rounded-lg" />
          <p className="mt-4 text-muted">{t("noAnimals")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              locale={locale}
              priceLabel={t("priceLabel")}
              availableLabel={t("available")}
              showWishlist
              inWishlist={animalIds.has(animal.id)}
              rating={ratings.get(animal.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildPageHref}
        previousLabel={tListing("paginationPrevious")}
        nextLabel={tListing("paginationNext")}
      />
    </main>
  );
}
