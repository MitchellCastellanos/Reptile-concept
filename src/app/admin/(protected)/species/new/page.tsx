import { SpeciesForm } from "../species-form";
import { createSpeciesAction } from "../actions";

export default function NewSpeciesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvelle espèce</h1>
      <SpeciesForm action={createSpeciesAction} />
    </div>
  );
}
