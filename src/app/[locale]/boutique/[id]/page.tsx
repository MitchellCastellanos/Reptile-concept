import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getProductById } from "@/lib/queries";
import { getProductImageUrl } from "@/lib/images";
import { AddProductToCartButton } from "@/components/add-to-cart-button";
import { PaymentBadges } from "@/components/payment-badges";
import { KlarnaInstallments } from "@/components/klarna-installments";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const locale = await getLocale();
  const t = await getTranslations("Boutique");
  const name = locale === "en" ? product.nameEn : product.nameFr;
  const description = locale === "en" ? product.descriptionEn : product.descriptionFr;
  const imageUrl = product.imageUrl || getProductImageUrl(product.category);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/boutique" className="w-fit text-sm font-medium text-primary hover:underline">
        &larr; {t("backToList")}
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-accent-light shadow-sm">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">
              {product.category.replace(/_/g, " ")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          </div>

          <div>
            <p className="text-2xl font-bold text-primary">{Number(product.priceCAD)} $ CAD</p>
            <KlarnaInstallments priceCAD={Number(product.priceCAD)} className="mt-1" />
          </div>

          <p className="text-sm font-medium text-muted">
            {product.stockQty > 0 ? t("inStock") : t("outOfStock")}
          </p>

          {description ? (
            <p className="whitespace-pre-line leading-relaxed text-muted">{description}</p>
          ) : null}

          <AddProductToCartButton
            id={product.id}
            name={name}
            priceCAD={Number(product.priceCAD)}
            stockQty={product.stockQty}
          />

          <PaymentBadges />
        </div>
      </div>
    </main>
  );
}
