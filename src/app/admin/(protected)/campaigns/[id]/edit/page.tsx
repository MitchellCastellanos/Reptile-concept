import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CampaignForm } from "../../campaign-form";
import { updateDraftAction, resendCampaignAction } from "../../actions";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  if (campaign.status === "sent") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Campagne envoyée</h1>
        <p className="text-sm text-zinc-500">
          Envoyée le {campaign.sentAt?.toLocaleString("fr-CA")} à {campaign.recipientCount}{" "}
          client(s). Ceci est en lecture seule — utilisez « Renvoyer » depuis la liste pour
          la réutiliser.
        </p>
        <div className="max-w-2xl rounded border border-black/10 p-4 dark:border-white/10">
          <p className="font-semibold">{campaign.subjectFr}</p>
          <p className="mt-2 whitespace-pre-line text-sm">{campaign.bodyFr}</p>
        </div>
        <form action={resendCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <button
            type="submit"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Renvoyer maintenant
          </button>
        </form>
      </div>
    );
  }

  const boundAction = updateDraftAction.bind(null, campaign.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Modifier le brouillon</h1>
      <CampaignForm campaign={campaign} saveAction={boundAction} />
    </div>
  );
}
