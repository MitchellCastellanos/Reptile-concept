import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeAdminReturnTo, withAdminFocus } from "@/lib/admin-catalog-listing";
import { ProductForm } from "../../product-form";
import { updateProductAction } from "../../actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const returnTo = safeAdminReturnTo("/admin/products", (await searchParams).returnTo);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const boundAction = updateProductAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={withAdminFocus(returnTo, id)}
        className="w-fit text-sm text-black/60 underline hover:text-foreground dark:text-white/60"
      >
        ← Retour à la liste
      </Link>
      <h1 className="text-2xl font-semibold">Modifier {product.nameFr}</h1>
      <ProductForm
        product={{ ...product, priceCAD: Number(product.priceCAD) }}
        extraPhotoUrls={product.media.map((m) => m.url)}
        action={boundAction}
        returnTo={returnTo}
      />
    </div>
  );
}
