"use client";

import { useState } from "react";
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
  photoUrl: initialPhotoUrl,
  action,
}: {
  species: Species[];
  animal?: Animal;
  photoUrl?: string;
  action: (formData: FormData) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl ?? "");

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Photo (URL ou chemin, ex. /images/animals/nom.jpg)
        <input
          name="photoUrl"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="/images/animals/seed-animal-pastel.jpg"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="mt-2 h-32 w-32 rounded object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
            onLoad={(e) => (e.currentTarget.style.display = "block")}
          />
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Espèce
        <select
          name="speciesId"
          defaultValue={animal?.speciesId}
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
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
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Sexe
        <select
          name="sex"
          defaultValue={animal?.sex ?? "unknown"}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
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
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Statut
        <select
          name="status"
          defaultValue={animal?.status ?? "available"}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
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
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (EN)
        <textarea
          name="descriptionEn"
          defaultValue={animal?.descriptionEn}
          required
          rows={3}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
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
