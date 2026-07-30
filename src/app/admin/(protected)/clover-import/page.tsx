import Link from "next/link";
import { prisma } from "@/lib/db";
import { ignoreCloverImportCandidateAction } from "./actions";

export default async function CloverImportPage() {
  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { status: "pending" },
    orderBy: { firstSeenAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nouveaux articles Clover</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Articles capturés directement sur l&apos;appareil Clover (comptoir ou salon) qui n&apos;ont
          pas encore de fiche sur le site. Créez la fiche animal/produit correspondante — l&apos;article
          Clover sera relié automatiquement, sans avoir à retrouver son identifiant à la main.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Rien en attente — tous les articles Clover sont déjà reliés à une fiche du site ou ignorés.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2">Nom (Clover)</th>
                <th className="py-2">Catégorie</th>
                <th className="py-2 text-right">Prix</th>
                <th className="py-2 text-right">Stock</th>
                <th className="py-2">Capté le</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const params = new URLSearchParams({
                  cloverItemId: candidate.cloverItemId,
                  cloverName: candidate.name,
                  priceCAD: String(candidate.priceCAD),
                });
                return (
                  <tr key={candidate.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2">{candidate.name}</td>
                    <td className="py-2">{candidate.cloverCategoryName ?? "—"}</td>
                    <td className="py-2 text-right">{Number(candidate.priceCAD).toFixed(2)} $</td>
                    <td className="py-2 text-right">{candidate.stockCount ?? "—"}</td>
                    <td className="py-2">{candidate.firstSeenAt.toLocaleDateString("fr-CA")}</td>
                    <td className="flex flex-wrap gap-3 py-2">
                      <Link href={`/admin/animals/new?${params.toString()}`} className="underline">
                        Créer un animal
                      </Link>
                      <Link href={`/admin/products/new?${params.toString()}`} className="underline">
                        Créer un produit
                      </Link>
                      <form action={ignoreCloverImportCandidateAction}>
                        <input type="hidden" name="id" value={candidate.id} />
                        <button type="submit" className="text-zinc-500 underline">
                          Ignorer
                        </button>
                      </form>
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
