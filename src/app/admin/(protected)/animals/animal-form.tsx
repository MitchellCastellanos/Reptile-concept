import type { Animal, Species } from "@/generated/prisma/client";

const SEX_OPTIONS = ["male", "female", "unknown"] as const;
const STATUS_OPTIONS = [
  "available",
  "reserved",
  "sold",
  "on_hold",
  "not_for_sale",
] as const;

export function AnimalForm({
  species,
  animal,
  action,
}: {
  species: Species[];
  animal?: Animal;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Espèce
        <select
          name="speciesId"
          defaultValue={animal?.speciesId}
          required
          className="admin-input"
        >
          {species.map((s) => (
            <option key={s.id} value={s.id}>
              {s.commonNameFr} / {s.commonNameEn}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Morph
        <input
          name="morph"
          defaultValue={animal?.morph}
          required
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Sexe
        <select
          name="sex"
          defaultValue={animal?.sex ?? "unknown"}
          className="admin-input"
        >
          {SEX_OPTIONS.map((sex) => (
            <option key={sex} value={sex}>
              {sex}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Prix (CAD)
        <input
          type="number"
          step="0.01"
          name="priceCAD"
          defaultValue={animal ? Number(animal.priceCAD) : undefined}
          required
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Statut
        <select
          name="status"
          defaultValue={animal?.status ?? "available"}
          className="admin-input"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (FR)
        <textarea
          name="descriptionFr"
          defaultValue={animal?.descriptionFr}
          required
          rows={3}
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (EN)
        <textarea
          name="descriptionEn"
          defaultValue={animal?.descriptionEn}
          required
          rows={3}
          className="admin-input"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Enregistrer
      </button>
    </form>
  );
}
