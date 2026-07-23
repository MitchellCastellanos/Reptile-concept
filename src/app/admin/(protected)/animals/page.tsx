import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteAnimalAction } from "./actions";

export default async function AdminAnimalsPage() {
  const animals = await prisma.animal.findMany({
    include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Animaux</h1>
        <Link
          href="/admin/animals/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouvel animal
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Photo</th>
            <th className="py-2">Espèce</th>
            <th className="py-2">Morph</th>
            <th className="py-2">Prix</th>
            <th className="py-2">Statut</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {animals.map((animal) => (
            <tr key={animal.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">
                {animal.media[0]?.url ? (
                  <Image
                    src={animal.media[0].url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded bg-black/5 text-xs text-zinc-500 dark:bg-white/5">
                    —
                  </span>
                )}
              </td>
              <td className="py-2">{animal.species.commonNameFr}</td>
              <td className="py-2">{animal.morph}</td>
              <td className="py-2">{Number(animal.priceCAD)} $</td>
              <td className="py-2">{animal.status}</td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/animals/${animal.id}/edit`} className="underline">
                  Modifier
                </Link>
                <form action={deleteAnimalAction}>
                  <input type="hidden" name="id" value={animal.id} />
                  <button type="submit" className="text-red-600 underline dark:text-red-400">
                    Supprimer
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
