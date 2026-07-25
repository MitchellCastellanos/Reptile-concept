import Link from "next/link";
import { prisma } from "@/lib/db";
import { sendExistingCampaignAction, resendCampaignAction, deleteCampaignAction } from "./actions";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campagnes courriel</h1>
        <Link
          href="/admin/campaigns/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouvelle campagne
        </Link>
      </div>

      <div className="overflow-x-auto">
<table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Sujet (FR)</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Destinataires</th>
            <th className="py-2">Date</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{campaign.subjectFr}</td>
              <td className="py-2">{campaign.status === "sent" ? "Envoyée" : "Brouillon"}</td>
              <td className="py-2">{campaign.recipientCount ?? "—"}</td>
              <td className="py-2">
                {campaign.sentAt?.toLocaleDateString("fr-CA") ??
                  campaign.createdAt.toLocaleDateString("fr-CA")}
              </td>
              <td className="flex flex-wrap gap-3 py-2">
                <Link href={`/admin/campaigns/${campaign.id}/edit`} className="underline">
                  {campaign.status === "sent" ? "Voir" : "Modifier"}
                </Link>
                {campaign.status === "draft" ? (
                  <form action={sendExistingCampaignAction}>
                    <input type="hidden" name="id" value={campaign.id} />
                    <button type="submit" className="underline">
                      Envoyer
                    </button>
                  </form>
                ) : (
                  <form action={resendCampaignAction}>
                    <input type="hidden" name="id" value={campaign.id} />
                    <button type="submit" className="underline">
                      Renvoyer
                    </button>
                  </form>
                )}
                <form action={deleteCampaignAction}>
                  <input type="hidden" name="id" value={campaign.id} />
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

      {campaigns.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucune campagne pour le moment.</p>
      ) : null}
    </div>
  );
}
