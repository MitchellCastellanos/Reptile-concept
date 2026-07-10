import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnimalForm } from "../../animal-form";
import { updateAnimalAction } from "../../actions";

export default async function EditAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [animal, species] = await Promise.all([
    prisma.animal.findUnique({ where: { id } }),
    prisma.species.findMany({ orderBy: { commonNameFr: "asc" } }),
  ]);
  if (!animal) notFound();

  const boundAction = updateAnimalAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Modifier {animal.morph}</h1>
      <AnimalForm species={species} animal={animal} action={boundAction} />
    </div>
  );
}
