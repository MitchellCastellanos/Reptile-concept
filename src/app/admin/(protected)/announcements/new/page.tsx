import { createAnnouncementAction } from "../actions";

export default function NewAnnouncementPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvelle annonce</h1>
      <form action={createAnnouncementAction} className="flex max-w-lg flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Message (FR)
          <textarea
            name="messageFr"
            required
            rows={2}
            className="admin-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Message (EN)
          <textarea
            name="messageEn"
            required
            rows={2}
            className="admin-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fin de l&apos;affichage (optionnel)
          <input
            type="datetime-local"
            name="endsAt"
            className="admin-input"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Publier
        </button>
      </form>
    </div>
  );
}
