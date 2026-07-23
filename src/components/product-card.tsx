import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getProductImageUrl } from "@/lib/images";
import { AddProductToCartButton } from "@/components/add-to-cart-button";
import { KlarnaInstallments } from "@/components/klarna-installments";

type ProductCardProduct = {
  id: string;
  category: string;
  nameFr: string;
  nameEn: string;
  imageUrl?: string | null;
  priceCAD: { toString(): string } | number;
  stockQty: number;
};

export function ProductCard({
  product,
  locale,
  inStockLabel,
  outOfStockLabel,
}: {
  product: ProductCardProduct;
  locale: string;
  inStockLabel: string;
  outOfStockLabel: string;
}) {
  const name = locale === "en" ? product.nameEn : product.nameFr;
  const imageUrl = product.imageUrl || getProductImageUrl(product.category);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <Link href={`/boutique/${product.id}`} className="group">
        <div className="relative aspect-[4/3] overflow-hidden bg-accent-light">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {product.category.replace(/_/g, " ")}
        </p>
        <Link href={`/boutique/${product.id}`} className="font-semibold text-foreground hover:text-primary">
          {name}
        </Link>
        <p className="text-sm font-medium text-primary">{Number(product.priceCAD)} $ CAD</p>
        <KlarnaInstallments priceCAD={Number(product.priceCAD)} />
        <p className="text-xs text-muted">
          {product.stockQty > 0 ? inStockLabel : outOfStockLabel}
        </p>
        <AddProductToCartButton
          id={product.id}
          name={name}
          priceCAD={Number(product.priceCAD)}
          stockQty={product.stockQty}
        />
      </div>
    </div>
  );
}
