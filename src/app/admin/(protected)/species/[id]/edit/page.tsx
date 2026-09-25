import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeAdminReturnTo, withAdminFocus } from "@/lib/admin-catalog-listing";
import { SpeciesForm } from "../../species-form";
import { updateSpeciesAction } from "../../actions";

export default async function EditSpeciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const returnTo = safeAdminReturnTo("/admin/species", (await searchParams).returnTo);
  const species = await prisma.species.findUnique({ where: { id } });
  if (!species) notFound();

  const boundAction = updateSpeciesAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={withAdminFocus(returnTo, id)}
        className="w-fit text-sm text-black/60 underline hover:text-foreground dark:text-white/60"
      >
        ← Retour à la liste
      </Link>
      <h1 className="text-2xl font-semibold">Modifier {species.commonNameFr}</h1>
      <SpeciesForm species={species} action={boundAction} returnTo={returnTo} />
    </div>
  );
}
