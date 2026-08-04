import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getAnimalImageUrl, getProductImageUrl } from "@/lib/images";
import { WishlistToggleButton } from "@/components/wishlist-toggle-button";

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const t = await getTranslations("Account");
  const home = await getTranslations("Home");
  const locale = await getLocale();

  const items = await prisma.wishlistItem.findMany({
    where: { customerId: customer.id },
    include: {
      animal: { include: { species: true, media: true } },
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/account" className="w-fit text-sm font-medium text-primary hover:underline">
          &larr; {t("backToAccount")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t("myWishlist")}</h1>
        {items.length > 0 ? (
          <p className="text-sm text-muted">{t("wishlistItemCount", { count: items.length })}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-muted">{t("noWishlist")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const animal = item.animal;
            const product = item.product;
            if (animal) {
              const name = locale === "en" ? animal.species.commonNameEn : animal.species.commonNameFr;
              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <Link href={`/animals/${animal.id}`} className="relative aspect-[4/3] overflow-hidden bg-accent-light">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getAnimalImageUrl(animal.species.category, animal.media)}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="font-semibold">
                      {name} — {animal.morph}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {home("priceLabel")}: {Number(animal.priceCAD)} $ CAD
                    </p>
                    <WishlistToggleButton type="animal" itemId={animal.id} initialActive label={t("removeFromWishlist")} />
                  </div>
                </div>
              );
            }
            if (product) {
              const name = locale === "en" ? product.nameEn : product.nameFr;
              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <Link href={`/boutique/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-accent-light">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl || getProductImageUrl(product.category)}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm font-medium text-primary">{Number(product.priceCAD)} $ CAD</p>
                    <WishlistToggleButton type="product" itemId={product.id} initialActive label={t("removeFromWishlist")} />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </main>
  );
}
