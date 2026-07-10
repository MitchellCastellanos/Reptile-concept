import { prisma } from "@/lib/db";
import { AnimalForm } from "../animal-form";
import { createAnimalAction } from "../actions";

export default async function NewAnimalPage() {
  const species = await prisma.species.findMany({ orderBy: { commonNameFr: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvel animal</h1>
      <AnimalForm species={species} action={createAnimalAction} />
    </div>
  );
}
