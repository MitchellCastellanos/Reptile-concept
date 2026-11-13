import { getLaunchNewsletterStatus } from "@/lib/newsletter";
import { getCurrentAdmin } from "@/lib/auth";
import { sendLaunchAction, sendLaunchTestAction } from "./actions";

// A list send can take a while on a big list (batched, 100 per call).
export const maxDuration = 60;

const MESSAGES: Record<string, string> = {
  "test=ok": "✅ Test envoyé (FR et EN). Vérifiez votre boîte de réception (et les pourriels).",
  "error=send": "❌ Impossible d'envoyer le test. Vérifiez RESEND_API_KEY / EMAIL_FROM.",
  "error=email": "❌ Adresse courriel invalide.",
  "error=confirm": "❌ Tapez ENVOYER pour confirmer l'envoi.",
  "error=already": "❌ Le lancement a déjà été envoyé (ou a échoué). Consultez Campagnes.",
};

export default async function NewsletterLaunchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [status, admin] = await Promise.all([getLaunchNewsletterStatus(), getCurrentAdmin()]);
  const flash = sp.sent
    ? `✅ Envoyé à ${sp.sent} abonnés${sp.failed && sp.failed !== "0" ? ` (${sp.failed} échecs)` : ""}.`
    : sp.test
      ? MESSAGES[`test=${sp.test}`]
      : sp.error
        ? MESSAGES[`error=${sp.error}`]
        : null;
  const total = status.fr + status.en;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Infolettre de lancement</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Annonce d&apos;ouverture + code BIENVENUE15 pour les abonnés actifs de l&apos;infolettre.
        Chaque personne le reçoit dans sa langue, avec son propre lien de désabonnement.
      </p>

      {flash ? <p className="rounded border border-black/10 p-3 text-sm dark:border-white/10">{flash}</p> : null}

      <section className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">1. Envoyer un test</h2>
        <form action={sendLaunchTestAction} className="flex flex-wrap gap-2">
          <input
            type="email"
            name="to"
            required
            defaultValue={admin?.email}
            className="min-w-64 flex-1 rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20"
          />
          <button type="submit" className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background">
            Envoyer le test (FR + EN)
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">2. Envoyer aux abonnés</h2>
        <p className="text-sm">
          Abonnés actifs : <strong>{total}</strong> ({status.fr} FR · {status.en} EN)
        </p>
        {status.alreadySentAt ? (
          <p className="text-sm font-medium">
            Déjà envoyé le {status.alreadySentAt.toLocaleString("fr-CA")}. Il n&apos;est pas possible de l&apos;envoyer à nouveau.
          </p>
        ) : (
          <form action={sendLaunchAction} className="flex flex-wrap gap-2">
            <input
              name="confirm"
              placeholder="Tapez ENVOYER"
              autoComplete="off"
              className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20"
            />
            <button
              type="submit"
              disabled={total === 0}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Envoyer à {total} abonnés
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
