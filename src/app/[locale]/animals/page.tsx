import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { AnimalCard } from "@/components/animal-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { CategoryPillNav } from "@/components/category-pill-nav";
import { ListingToolbar } from "@/components/listing-toolbar";
import { ANIMAL_CATEGORIES, getAvailableAnimals, getWishlistedIds, isAnimalCategory } from "@/lib/queries";
import { getCurrentCustomer } from "@/lib/customer-auth";

export default async function AnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const t = await getTranslations("Home");
  const tAnimal = await getTranslations("Animal");
  const tListing = await getTranslations("Listing");
  const tCategories = await getTranslations("NavCategories");
  const locale = await getLocale();
  const animals = await getAvailableAnimals(category, sort);
  const customer = await getCurrentCustomer();
  const { animalIds } = await getWishlistedIds(customer?.id);

  const activeCategory = isAnimalCategory(category) ? category : undefined;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: t("availableAnimals"), href: activeCategory ? "/animals" : undefined },
            ...(activeCategory ? [{ label: tCategories(activeCategory) }] : []),
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {activeCategory ? tCategories(activeCategory) : t("availableAnimals")}
          </h1>
          <p className="mt-2 text-muted">{t("animalsSubtitle")}</p>
        </div>
      </div>

      <CategoryPillNav
        allLabel={tListing("allAnimals")}
        activeValue={activeCategory}
        items={ANIMAL_CATEGORIES.map((value) => ({ value, label: tCategories(value) }))}
      />

      <ListingToolbar resultCount={animals.length} />

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
            />
          ))}
        </div>
      )}
    </main>
  );
}
