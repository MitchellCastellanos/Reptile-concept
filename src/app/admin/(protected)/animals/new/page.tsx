import { prisma } from "@/lib/db";
import { AnimalForm } from "../animal-form";
import { createAnimalAction } from "../actions";

export default async function NewAnimalPage({
  searchParams,
}: {
  searchParams: Promise<{ cloverItemId?: string; cloverName?: string; priceCAD?: string }>;
}) {
  const params = await searchParams;
  const species = await prisma.species.findMany({ orderBy: { commonNameFr: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvel animal</h1>
      <AnimalForm
        species={species}
        action={createAnimalAction}
        prefill={
          params.cloverItemId
            ? {
                cloverItemId: params.cloverItemId,
                suggestedName: params.cloverName,
                priceCAD: params.priceCAD ? Number(params.priceCAD) : undefined,
              }
            : undefined
        }
      />
    </div>
  );
}
