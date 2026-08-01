import { NewCustomerForm, ImportCustomersCsvForm } from "./customer-forms";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Nouveau client</h1>
        <div className="mt-4">
          <NewCustomerForm />
        </div>
      </div>

      <div className="border-t border-black/10 pt-8 dark:border-white/10">
        <h2 className="text-xl font-semibold">Importer plusieurs clients (CSV/Excel)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Pour absorber votre base de données QuickBooks existante : exportez vos contacts en
          CSV ou Excel (.xlsx) depuis QuickBooks (ou Excel) et importez-les ici en un clic.
        </p>
        <div className="mt-4">
          <ImportCustomersCsvForm />
        </div>
      </div>
    </div>
  );
}
