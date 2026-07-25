import type { EmailCampaign } from "@/generated/prisma/client";

export function CampaignForm({
  campaign,
  saveAction,
  sendAction,
}: {
  campaign?: EmailCampaign;
  saveAction: (formData: FormData) => void;
  sendAction?: (formData: FormData) => void;
}) {
  return (
    <form action={saveAction} className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm font-semibold">Français</p>
        <label className="flex flex-col gap-1 text-sm">
          Sujet
          <input
            name="subjectFr"
            defaultValue={campaign?.subjectFr}
            required
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Message
          <textarea
            name="bodyFr"
            defaultValue={campaign?.bodyFr}
            required
            rows={6}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 rounded border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm font-semibold">English</p>
        <label className="flex flex-col gap-1 text-sm">
          Subject
          <input
            name="subjectEn"
            defaultValue={campaign?.subjectEn}
            required
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Message
          <textarea
            name="bodyEn"
            defaultValue={campaign?.bodyEn}
            required
            rows={6}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded border border-black/20 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Enregistrer comme brouillon
        </button>
        {sendAction ? (
          <button
            type="submit"
            formAction={sendAction}
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Envoyer à tous les clients maintenant
          </button>
        ) : null}
      </div>
    </form>
  );
}
