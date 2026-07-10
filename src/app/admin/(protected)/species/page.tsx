import Link from "next/link";
import { prisma } from "@/lib/db";
import { isCareSheetIncomplete } from "@/lib/species-utils";
import { deleteSpeciesAction } from "./actions";

export default async function AdminSpeciesPage() {
  const species = await prisma.species.findMany({
    orderBy: { commonNameFr: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Espèces</h1>
        <Link
          href="/admin/species/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouvelle espèce
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Nom scientifique</th>
            <th className="py-2">Nom commun</th>
            <th className="py-2">Fiche de soins</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {species.map((s) => (
            <tr key={s.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 italic">{s.scientificName}</td>
              <td className="py-2">
                {s.commonNameFr} / {s.commonNameEn}
              </td>
              <td className="py-2">
                {isCareSheetIncomplete(s) ? (
                  <span className="text-amber-600 dark:text-amber-400">Incomplète</span>
                ) : (
                  <span className="text-green-700 dark:text-green-500">Complète</span>
                )}
              </td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/species/${s.id}/edit`} className="underline">
                  Modifier
                </Link>
                <form action={deleteSpeciesAction}>
                  <input type="hidden" name="id" value={s.id} />
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
