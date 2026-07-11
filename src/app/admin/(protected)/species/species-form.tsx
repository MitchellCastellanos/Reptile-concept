"use client";

import { useState } from "react";
import type { Species } from "@/generated/prisma/client";
import { SpeciesChatGptHelper } from "@/components/admin/SpeciesChatGptHelper";
import { EXPERIENCE_LEVELS, isCareSheetIncomplete } from "@/lib/species-utils";
import type { SpeciesFormFields } from "@/lib/species-utils";

type FormState = SpeciesFormFields & {
  scientificName: string;
  careSheetUrl: string;
};

function toFormState(species?: Species): FormState {
  return {
    commonNameFr: species?.commonNameFr ?? "",
    commonNameEn: species?.commonNameEn ?? "",
    scientificName: species?.scientificName ?? "",
    careSheetUrl: species?.careSheetUrl ?? "",
    experienceLevel: species?.experienceLevel ?? undefined,
    descriptionFr: species?.descriptionFr ?? "",
    descriptionEn: species?.descriptionEn ?? "",
    adultSizeFr: species?.adultSizeFr ?? "",
    adultSizeEn: species?.adultSizeEn ?? "",
    lifespanFr: species?.lifespanFr ?? "",
    lifespanEn: species?.lifespanEn ?? "",
    temperamentFr: species?.temperamentFr ?? "",
    temperamentEn: species?.temperamentEn ?? "",
    dietFr: species?.dietFr ?? "",
    dietEn: species?.dietEn ?? "",
    humidity: species?.humidity ?? "",
    tempDay: species?.tempDay ?? "",
    tempNight: species?.tempNight ?? "",
    uvbNeeds: species?.uvbNeeds ?? "",
    enclosureMinSize: species?.enclosureMinSize ?? "",
    substrate: species?.substrate ?? "",
    feedingFrequency: species?.feedingFrequency ?? "",
    handlingFr: species?.handlingFr ?? "",
    handlingEn: species?.handlingEn ?? "",
  };
}

const inputClass =
  "rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black";

function TextField({
  label,
  name,
  value,
  onChange,
  required,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        value={value}
        required={required}
        onChange={(e) => onChange(name, e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <textarea
        name={name}
        value={value}
        rows={3}
        onChange={(e) => onChange(name, e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

export function SpeciesForm({
  species,
  action,
}: {
  species?: Species;
  action: (formData: FormData) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(species));
  const showHelper = isCareSheetIncomplete(species) || !species;

  function setField(name: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function applyParsedFields(parsed: Partial<SpeciesFormFields>) {
    setForm((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => value !== undefined),
      ),
    }));
  }

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <TextField
        label="Nom scientifique"
        name="scientificName"
        value={form.scientificName}
        onChange={setField}
        required
      />

      {showHelper && (
        <SpeciesChatGptHelper
          scientificName={form.scientificName}
          onApply={applyParsedFields}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Nom commun (FR)"
          name="commonNameFr"
          value={form.commonNameFr ?? ""}
          onChange={setField}
          required
        />
        <TextField
          label="Nom commun (EN)"
          name="commonNameEn"
          value={form.commonNameEn ?? ""}
          onChange={setField}
          required
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Niveau d&apos;expérience
        <select
          name="experienceLevel"
          value={form.experienceLevel ?? ""}
          onChange={(e) => setField("experienceLevel", e.target.value)}
          className={inputClass}
        >
          <option value="">—</option>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <TextField
        label="Fiche de soins (URL)"
        name="careSheetUrl"
        value={form.careSheetUrl}
        onChange={setField}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextAreaField
          label="Description (FR)"
          name="descriptionFr"
          value={form.descriptionFr ?? ""}
          onChange={setField}
        />
        <TextAreaField
          label="Description (EN)"
          name="descriptionEn"
          value={form.descriptionEn ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Taille adulte (FR)"
          name="adultSizeFr"
          value={form.adultSizeFr ?? ""}
          onChange={setField}
        />
        <TextField
          label="Taille adulte (EN)"
          name="adultSizeEn"
          value={form.adultSizeEn ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Longévité (FR)"
          name="lifespanFr"
          value={form.lifespanFr ?? ""}
          onChange={setField}
        />
        <TextField
          label="Longévité (EN)"
          name="lifespanEn"
          value={form.lifespanEn ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Tempérament (FR)"
          name="temperamentFr"
          value={form.temperamentFr ?? ""}
          onChange={setField}
        />
        <TextField
          label="Tempérament (EN)"
          name="temperamentEn"
          value={form.temperamentEn ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Alimentation (FR)"
          name="dietFr"
          value={form.dietFr ?? ""}
          onChange={setField}
        />
        <TextField
          label="Alimentation (EN)"
          name="dietEn"
          value={form.dietEn ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Humidité"
          name="humidity"
          value={form.humidity ?? ""}
          onChange={setField}
        />
        <TextField
          label="Fréquence de nourrissage"
          name="feedingFrequency"
          value={form.feedingFrequency ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Température (jour)"
          name="tempDay"
          value={form.tempDay ?? ""}
          onChange={setField}
        />
        <TextField
          label="Température (nuit)"
          name="tempNight"
          value={form.tempNight ?? ""}
          onChange={setField}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Besoins UVB"
          name="uvbNeeds"
          value={form.uvbNeeds ?? ""}
          onChange={setField}
        />
        <TextField
          label="Taille min. du terrarium"
          name="enclosureMinSize"
          value={form.enclosureMinSize ?? ""}
          onChange={setField}
        />
      </div>

      <TextField
        label="Substrat"
        name="substrate"
        value={form.substrate ?? ""}
        onChange={setField}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Manipulation (FR)"
          name="handlingFr"
          value={form.handlingFr ?? ""}
          onChange={setField}
        />
        <TextField
          label="Manipulation (EN)"
          name="handlingEn"
          value={form.handlingEn ?? ""}
          onChange={setField}
        />
      </div>

      <button
        type="submit"
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Enregistrer
      </button>
    </form>
  );
}
