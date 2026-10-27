import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeAdminReturnTo, withAdminFocus } from "@/lib/admin-catalog-listing";
import { SpeciesForm } from "../../species-form";
import { mergeSpeciesAction, updateSpeciesAction } from "../../actions";

export default async function EditSpeciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const returnTo = safeAdminReturnTo("/admin/species", (await searchParams).returnTo);
  const species = await prisma.species.findUnique({ where: { id } });
  if (!species) notFound();

  const boundAction = updateSpeciesAction.bind(null, id);
  const [others, animalCount] = await Promise.all([
    prisma.species.findMany({
      where: { id: { not: id }, NOT: { id: { startsWith: "clover-species-" } } },
      orderBy: { commonNameFr: "asc" },
      select: { id: true, commonNameFr: true, scientificName: true },
    }),
    prisma.animal.count({ where: { speciesId: id } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={withAdminFocus(returnTo, id)}
        className="w-fit text-sm text-black/60 underline hover:text-foreground dark:text-white/60"
      >
        ← Retour à la liste
      </Link>
      <h1 className="text-2xl font-semibold">Modifier {species.commonNameFr}</h1>
      <SpeciesForm species={species} action={boundAction} returnTo={returnTo} />

      <form
        action={mergeSpeciesAction}
        className="flex max-w-2xl flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <h2 className="text-lg font-semibold">Fusionner avec une autre espèce (doublon)</h2>
        <p className="text-xs text-black/60 dark:text-white/60">
          Les {animalCount} animal(aux) de « {species.commonNameFr} » seront rattachés à l&apos;espèce choisie,
          puis « {species.commonNameFr} » sera supprimée. Action irréversible.
        </p>
        <input type="hidden" name="sourceId" value={id} />
        <select
          name="targetId"
          required
          defaultValue=""
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
        >
          <option value="" disabled>
            Espèce à conserver…
          </option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.commonNameFr} ({o.scientificName})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-fit rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 dark:border-red-400 dark:text-red-400"
        >
          Fusionner et supprimer le doublon
        </button>
      </form>
    </div>
  );
}
