import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminWishlistsPage() {
  const items = await prisma.wishlistItem.findMany({
    include: {
      customer: true,
      animal: { include: { species: true } },
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Listes de souhaits</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Articles enregistrés par les clients sur le site.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun article en liste de souhaits.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Article</th>
                <th className="py-2 pr-4 font-medium">Prix</th>
                <th className="py-2 pr-4 font-medium">Ajouté le</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const animal = item.animal;
                const product = item.product;
                const label = animal
                  ? `${animal.species.commonNameFr} — ${animal.morph}`
                  : product
                    ? product.nameFr
                    : "—";
                const price = animal ? animal.priceCAD : product ? product.priceCAD : null;
                const adminHref = animal
                  ? `/admin/animals/${animal.id}/edit`
                  : product
                    ? `/admin/products/${product.id}/edit`
                    : null;

                return (
                  <tr key={item.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-4">
                      <Link href={`/admin/customers/${item.customer.id}`} className="underline">
                        {item.customer.fullName}
                      </Link>
                      <p className="text-xs text-zinc-500">{item.customer.email}</p>
                    </td>
                    <td className="py-2 pr-4">{animal ? "Animal" : product ? "Produit" : "—"}</td>
                    <td className="py-2 pr-4">{label}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {price != null ? `${Number(price).toFixed(2)} $` : "—"}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {item.createdAt.toLocaleDateString("fr-CA")}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      {adminHref ? (
                        <Link href={adminHref} className="underline">
                          Voir fiche
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
