import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteProductAction } from "./actions";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouveau produit
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Photo</th>
            <th className="py-2">SKU</th>
            <th className="py-2">Nom</th>
            <th className="py-2">Catégorie</th>
            <th className="py-2">Prix</th>
            <th className="py-2">Stock</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded bg-black/5 text-xs text-zinc-500 dark:bg-white/5">
                    —
                  </span>
                )}
              </td>
              <td className="py-2">{product.sku}</td>
              <td className="py-2">{product.nameFr}</td>
              <td className="py-2">{product.category}</td>
              <td className="py-2">{Number(product.priceCAD)} $</td>
              <td className="py-2">{product.stockQty}</td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/products/${product.id}/edit`} className="underline">
                  Modifier
                </Link>
                <form action={deleteProductAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <button type="submit" className="text-red-600 underline dark:text-red-400">
                    Supprimer
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
