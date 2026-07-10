import { ProductForm } from "../product-form";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouveau produit</h1>
      <ProductForm action={createProductAction} />
    </div>
  );
}
