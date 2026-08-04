import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "../../product-form";
import { updateProductAction } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const boundAction = updateProductAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Modifier {product.nameFr}</h1>
      <ProductForm
        product={{ ...product, priceCAD: Number(product.priceCAD) }}
        extraPhotoUrls={product.media.map((m) => m.url)}
        action={boundAction}
      />
    </div>
  );
}
