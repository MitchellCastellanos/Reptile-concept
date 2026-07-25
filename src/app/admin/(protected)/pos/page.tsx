import { prisma } from "@/lib/db";
import { PosForm } from "./pos-form";

export default async function AdminPosPage() {
  const [animals, products] = await Promise.all([
    prisma.animal.findMany({
      where: { status: "available" },
      include: { species: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { stockQty: { gt: 0 } },
      orderBy: { nameFr: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Vente en magasin</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Enregistrez une vente faite en personne. Au comptant, l&apos;inventaire est retiré et
          le montant s&apos;ajoute à la petite caisse immédiatement. Par carte, la transaction est
          envoyée à votre terminal Clover et la vente se finalise une fois la réponse reçue.
        </p>
      </div>
      <PosForm
        animals={animals.map((a) => ({
          id: a.id,
          label: `${a.species.commonNameFr} — ${a.morph}`,
          priceCAD: Number(a.priceCAD),
        }))}
        products={products.map((p) => ({
          id: p.id,
          label: p.nameFr,
          priceCAD: Number(p.priceCAD),
          stockQty: p.stockQty,
        }))}
      />
    </div>
  );
}
