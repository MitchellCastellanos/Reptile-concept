import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateCustomerNotesAction } from "../actions";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      addresses: true,
      wishlistItems: {
        include: {
          animal: { include: { species: true } },
          product: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) notFound();

  const boundAction = updateCustomerNotesAction.bind(null, customer.id);
  const address = customer.addresses[0];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
        {customer.companyName ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{customer.companyName}</p>
        ) : null}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {customer.email} · {customer.phone ?? "sans téléphone"} · langue préférée:{" "}
        {customer.preferredLang}
        {customer.customerType ? <> · type: {customer.customerType}</> : null}
        {" · "}solde: {customer.currentBalanceCAD.toString()} $
      </p>
      {address ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {address.street}, {address.city}, {address.province} {address.postalCode},{" "}
          {address.country}
        </p>
      ) : null}
      {customer.attachmentsNote ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pièces jointes: {customer.attachmentsNote}
        </p>
      ) : null}

      <section>
        <h2 className="font-medium">Liste de souhaits</h2>
        {customer.wishlistItems.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Aucun article enregistré.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {customer.wishlistItems.map((item) => {
              const animal = item.animal;
              const product = item.product;
              const label = animal
                ? `${animal.species.commonNameFr} — ${animal.morph}`
                : product
                  ? product.nameFr
                  : "—";
              const price = animal ? animal.priceCAD : product ? product.priceCAD : null;
              const adminHref = animal
                ? `/admin/animals/${animal.id}/edit`
                : product
                  ? `/admin/products/${product.id}/edit`
                  : null;

              return (
                <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span>{label}</span>
                  {price != null ? (
                    <span className="text-zinc-500">({Number(price).toFixed(2)} $)</span>
                  ) : null}
                  <span className="text-zinc-500">
                    — ajouté le {item.createdAt.toLocaleDateString("fr-CA")}
                  </span>
                  {adminHref ? (
                    <Link href={adminHref} className="underline">
                      Voir fiche
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium">Historique des commandes</h2>
        {customer.orders.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Aucune commande.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {customer.orders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="underline">
                  #{order.id.slice(0, 8)}
                </Link>{" "}
                — {order.status} — {order.createdAt.toLocaleDateString("fr-CA")}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium">Notes internes</h2>
        <form action={boundAction} className="mt-2 flex max-w-md flex-col gap-4">
          <textarea
            name="internalNotes"
            defaultValue={customer.internalNotes ?? ""}
            rows={4}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
          <button
            type="submit"
            className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Enregistrer
          </button>
        </form>
      </section>
    </div>
  );
}
