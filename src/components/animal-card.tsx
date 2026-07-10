import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getAnimalImageUrl } from "@/lib/images";

type AnimalCardAnimal = {
  id: string;
  morph: string;
  priceCAD: { toString(): string } | number;
  species: { id: string; commonNameFr: string; commonNameEn: string };
  media: { url: string }[];
};

export function AnimalCard({
  animal,
  locale,
  priceLabel,
  availableLabel,
}: {
  animal: AnimalCardAnimal;
  locale: string;
  priceLabel: string;
  availableLabel?: string;
}) {
  const speciesName =
    locale === "en" ? animal.species.commonNameEn : animal.species.commonNameFr;
  const imageUrl = getAnimalImageUrl(animal.species.id, animal.media);

  return (
    <Link
      href={`/animals/${animal.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-accent-light">
        <Image
          src={imageUrl}
          alt={`${speciesName} — ${animal.morph}`}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {availableLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">
            {availableLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{speciesName}</p>
        <p className="font-semibold text-foreground">{animal.morph}</p>
        <p className="mt-auto pt-2 text-sm font-medium text-primary">
          {priceLabel}: {Number(animal.priceCAD)} $ CAD
        </p>
      </div>
    </Link>
  );
}
