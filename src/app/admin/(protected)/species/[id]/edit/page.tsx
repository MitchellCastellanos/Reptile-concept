import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SpeciesForm } from "../../species-form";
import { updateSpeciesAction } from "../../actions";

export default async function EditSpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const species = await prisma.species.findUnique({ where: { id } });
  if (!species) notFound();

  const boundAction = updateSpeciesAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Modifier {species.commonNameFr}</h1>
      <SpeciesForm species={species} action={boundAction} />
    </div>
  );
}
