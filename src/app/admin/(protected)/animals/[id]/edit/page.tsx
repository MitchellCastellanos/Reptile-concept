import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnimalForm } from "../../animal-form";
import { updateAnimalAction, convertAnimalToProductAction } from "../../actions";

export default async function EditAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [animal, species] = await Promise.all([
    prisma.animal.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.species.findMany({ orderBy: { commonNameFr: "asc" } }),
  ]);
  if (!animal) notFound();

  const boundAction = updateAnimalAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Modifier {animal.morph}</h1>
      <AnimalForm
        species={species}
        animal={animal}
        photoUrl={animal.media[0]?.url ?? ""}
        action={boundAction}
      />

      <div className="max-w-lg rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
        <p className="font-medium">Ce n&apos;est pas un animal ?</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Si cette fiche a été créée par erreur depuis Clover (ex. de la nourriture rangée sous une
          catégorie d&apos;animal), convertissez-la en produit. La fiche animal sera archivée
          (non disponible à la vente) et vous serez redirigé vers un nouveau produit pré-rempli avec
          son lien Clover.
        </p>
        <form action={convertAnimalToProductAction} className="mt-3">
          <input type="hidden" name="id" value={animal.id} />
          <button type="submit" className="rounded border border-black/20 px-3 py-1.5 underline dark:border-white/20">
            Convertir en produit
          </button>
        </form>
      </div>
    </div>
  );
}
