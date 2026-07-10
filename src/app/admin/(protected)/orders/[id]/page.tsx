import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateOrderStatusAction } from "../actions";

const STATUS_OPTIONS = [
  "pending_payment",
  "paid",
  "preparing",
  "weather_hold",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      shippingAddress: true,
      items: { include: { animal: true, product: true } },
      payments: true,
    },
  });
  if (!order) notFound();

  const boundAction = updateOrderStatusAction.bind(null, order.id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Commande #{order.id.slice(0, 8)}</h1>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-medium">Client</h2>
          <p className="text-sm">{order.customer.fullName}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.customer.email}</p>
        </div>
        <div>
          <h2 className="font-medium">Adresse de livraison</h2>
          <p className="text-sm">
            {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.province} {order.shippingAddress.postalCode}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-medium">Articles</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.animal ? item.animal.morph : item.product?.nameFr} &times;{" "}
              {item.quantity} — {Number(item.priceAtSaleCAD)} $
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Mettre à jour le statut</h2>
        <form action={boundAction} className="mt-2 flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Statut
            <select
              name="status"
              defaultValue={order.status}
              className="admin-input"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Transporteur
            <input
              name="carrier"
              defaultValue={order.carrier ?? ""}
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Numéro de suivi
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="admin-input"
            />
          </label>
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
