import { ProductForm } from "../product-form";
import { createProductAction } from "../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ cloverItemId?: string; cloverName?: string; priceCAD?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouveau produit</h1>
      <ProductForm
        action={createProductAction}
        prefill={
          params.cloverItemId
            ? {
                cloverItemId: params.cloverItemId,
                suggestedName: params.cloverName,
                priceCAD: params.priceCAD ? Number(params.priceCAD) : undefined,
              }
            : undefined
        }
      />
    </div>
  );
}
