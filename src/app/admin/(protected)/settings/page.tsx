import { getStoreSettings } from "@/lib/queries";
import { updateStoreSettingsAction } from "./actions";

const HOURS_FIELDS = [
  { name: "hoursMon", label: "Lundi" },
  { name: "hoursTue", label: "Mardi" },
  { name: "hoursWed", label: "Mercredi" },
  { name: "hoursThu", label: "Jeudi" },
  { name: "hoursFri", label: "Vendredi" },
  { name: "hoursSat", label: "Samedi" },
  { name: "hoursSun", label: "Dimanche" },
] as const;

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Paramètres du magasin</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Ces informations sont affichées dans le pied de page du site public (téléphone, adresse,
        horaires).
      </p>

      <form action={updateStoreSettingsAction} className="flex max-w-lg flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Téléphone
          <input name="phone" defaultValue={settings.phone} className="admin-input" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Adresse (FR)
          <input name="addressFr" defaultValue={settings.addressFr} className="admin-input" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Adresse (EN)
          <input name="addressEn" defaultValue={settings.addressEn} className="admin-input" />
        </label>

        <h2 className="mt-2 font-medium">Horaires</h2>
        <p className="-mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Texte libre, ex. « 11h00–18h00 » ou « Fermé ».
        </p>
        {HOURS_FIELDS.map(({ name, label }) => (
          <label key={name} className="flex flex-col gap-1 text-sm">
            {label}
            <input
              name={name}
              defaultValue={settings[name]}
              className="admin-input"
            />
          </label>
        ))}

        <button
          type="submit"
          className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
