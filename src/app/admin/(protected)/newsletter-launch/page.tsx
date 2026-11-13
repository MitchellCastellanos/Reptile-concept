import { getLaunchNewsletterStatus } from "@/lib/newsletter";
import { getCurrentAdmin } from "@/lib/auth";
import { sendLaunchAction, sendLaunchTestAction } from "./actions";

// A list send can take a while on a big list (batched, 100 per call).
export const maxDuration = 60;

const MESSAGES: Record<string, string> = {
  "test=ok": "✅ Prueba enviada (FR y EN). Revisa tu bandeja (y spam).",
  "error=send": "❌ No se pudo enviar la prueba. Revisa RESEND_API_KEY / EMAIL_FROM.",
  "error=email": "❌ Correo inválido.",
  "error=confirm": "❌ Escribe ENVOYER para confirmar el envío.",
  "error=already": "❌ El lanzamiento ya fue enviado antes (o falló). Revisa Campagnes.",
};

export default async function NewsletterLaunchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [status, admin] = await Promise.all([getLaunchNewsletterStatus(), getCurrentAdmin()]);
  const flash = sp.sent
    ? `✅ Enviado a ${sp.sent} suscriptores${sp.failed && sp.failed !== "0" ? ` (${sp.failed} fallaron)` : ""}.`
    : sp.test
      ? MESSAGES[`test=${sp.test}`]
      : sp.error
        ? MESSAGES[`error=${sp.error}`]
        : null;
  const total = status.fr + status.en;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Newsletter de lancement</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Anuncio de apertura + código BIENVENUE15 para los suscriptores activos del newsletter. Cada
        persona lo recibe en su idioma, con su propio enlace para darse de baja.
      </p>

      {flash ? <p className="rounded border border-black/10 p-3 text-sm dark:border-white/10">{flash}</p> : null}

      <section className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">1. Enviar prueba</h2>
        <form action={sendLaunchTestAction} className="flex flex-wrap gap-2">
          <input
            type="email"
            name="to"
            required
            defaultValue={admin?.email}
            className="min-w-64 flex-1 rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20"
          />
          <button type="submit" className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background">
            Enviar prueba (FR + EN)
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">2. Enviar a los suscriptores</h2>
        <p className="text-sm">
          Suscriptores activos: <strong>{total}</strong> ({status.fr} FR · {status.en} EN)
        </p>
        {status.alreadySentAt ? (
          <p className="text-sm font-medium">
            Ya enviado el {status.alreadySentAt.toLocaleString("fr-CA")}. No se puede enviar de nuevo.
          </p>
        ) : (
          <form action={sendLaunchAction} className="flex flex-wrap gap-2">
            <input
              name="confirm"
              placeholder="Escribe ENVOYER"
              autoComplete="off"
              className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20"
            />
            <button
              type="submit"
              disabled={total === 0}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Enviar a {total} suscriptores
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
