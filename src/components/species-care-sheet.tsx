import { isCloverPlaceholderSpeciesId } from "@/lib/admin-catalog-counts";
import type { Species } from "@/generated/prisma/client";

type SpeciesCare = Pick<
  Species,
  | "id"
  | "descriptionFr"
  | "descriptionEn"
  | "experienceLevel"
  | "adultSizeFr"
  | "adultSizeEn"
  | "lifespanFr"
  | "lifespanEn"
  | "temperamentFr"
  | "temperamentEn"
  | "dietFr"
  | "dietEn"
  | "humidity"
  | "tempDay"
  | "tempNight"
  | "uvbNeeds"
  | "enclosureMinSize"
  | "substrate"
  | "feedingFrequency"
  | "handlingFr"
  | "handlingEn"
>;

export function hasSpeciesCareSheet(species: SpeciesCare) {
  if (isCloverPlaceholderSpeciesId(species.id)) return false;
  return Boolean(species.descriptionEn || species.descriptionFr);
}

export function SpeciesCareSheet({
  species,
  locale,
  t,
}: {
  species: SpeciesCare;
  locale: string;
  t: (key: string) => string;
}) {
  if (!hasSpeciesCareSheet(species)) return null;

  const en = locale === "en";
  const description = en ? species.descriptionEn : species.descriptionFr;
  const rows: { label: string; value: string | null | undefined }[] = [
    {
      label: t("experienceLevel"),
      value: species.experienceLevel
        ? t(`experience_${species.experienceLevel}`)
        : null,
    },
    { label: t("adultSize"), value: en ? species.adultSizeEn : species.adultSizeFr },
    { label: t("lifespan"), value: en ? species.lifespanEn : species.lifespanFr },
    { label: t("temperament"), value: en ? species.temperamentEn : species.temperamentFr },
    { label: t("diet"), value: en ? species.dietEn : species.dietFr },
    { label: t("humidity"), value: species.humidity },
    {
      label: t("temperature"),
      value:
        species.tempDay || species.tempNight
          ? [species.tempDay, species.tempNight].filter(Boolean).join(" / ")
          : null,
    },
    { label: t("uvbNeeds"), value: species.uvbNeeds },
    { label: t("enclosure"), value: species.enclosureMinSize },
    { label: t("substrate"), value: species.substrate },
    { label: t("feeding"), value: species.feedingFrequency },
    { label: t("handling"), value: en ? species.handlingEn : species.handlingFr },
  ].filter((r) => r.value);

  return (
    <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{t("careSheetTitle")}</h2>
      {description ? (
        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{description}</p>
      ) : null}
      {rows.length > 0 ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">{row.label}</dt>
              <dd className="mt-0.5 text-sm">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
