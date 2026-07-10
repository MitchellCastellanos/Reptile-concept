import Link from "next/link";
import { prisma } from "@/lib/db";
import { toggleAnnouncementAction } from "./actions";

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Annonces</h1>
        <Link
          href="/admin/announcements/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouvelle annonce
        </Link>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Un seul bandeau actif s&apos;affiche à la fois sur le site (le plus récent).
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Message (FR)</th>
            <th className="py-2">Fin</th>
            <th className="py-2">Actif</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {announcements.map((announcement) => (
            <tr key={announcement.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{announcement.messageFr}</td>
              <td className="py-2">
                {announcement.endsAt
                  ? announcement.endsAt.toLocaleString("fr-CA")
                  : "sans date de fin"}
              </td>
              <td className="py-2">{announcement.active ? "Oui" : "Non"}</td>
              <td className="py-2">
                <form action={toggleAnnouncementAction}>
                  <input type="hidden" name="id" value={announcement.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(announcement.active)}
                  />
                  <button type="submit" className="underline">
                    {announcement.active ? "Désactiver" : "Activer"}
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
