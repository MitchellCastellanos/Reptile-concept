import { CampaignForm } from "../campaign-form";
import { saveDraftAction, sendNewCampaignAction } from "../actions";

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvelle campagne courriel</h1>
      <p className="max-w-2xl text-sm text-zinc-500">
        Rédigez votre message en français et en anglais. Chaque client reçoit la version dans
        sa langue préférée. Vous pouvez enregistrer comme brouillon pour continuer plus tard,
        ou envoyer immédiatement à tous vos clients.
      </p>
      <CampaignForm saveAction={saveDraftAction} sendAction={sendNewCampaignAction} />
    </div>
  );
}
