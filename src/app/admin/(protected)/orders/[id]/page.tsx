import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  markPreparingAction,
  markReadyForPickupAction,
  markPickedUpAction,
  cancelOrderAction,
} from "../actions";

const STATUS_LABELS: Record<string, string> = {
  paid: "Payée",
  preparing: "En préparation",
  ready_for_pickup: "Prête pour retrait",
  picked_up: "Récupérée",
  cancelled: "Annulée",
  refunded: "Annulée / remboursée",
};

const FINANCIAL_TYPE_LABELS: Record<string, string> = {
  sale: "Vente",
  refund: "Remboursement",
  cancellation_fee: "Frais d'annulation",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

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
      financialRecords: { orderBy: { createdAt: "asc" } },
      review: true,
    },
  });
  if (!order) notFound();

  const boundPreparing = markPreparingAction.bind(null, order.id);
  const boundReady = markReadyForPickupAction.bind(null, order.id);
  const boundPickedUp = markPickedUpAction.bind(null, order.id);
  const boundCancel = cancelOrderAction.bind(null, order.id);

  const isOverdue =
    order.status === "ready_for_pickup" &&
    order.pickupDeadlineAt !== null &&
    order.pickupDeadlineAt < new Date();

  const total = order.items.reduce((sum, item) => sum + Number(item.priceAtSaleCAD) * item.quantity, 0);

  const canCancel = !["picked_up", "cancelled", "refunded"].includes(order.status);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commande #{order.id.slice(0, 8)}</h1>
        <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium dark:bg-white/10">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {isOverdue ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Délai de retrait dépassé — cette commande sera annulée et remboursée (moins les frais
          d&apos;annulation) automatiquement.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-medium">Client</h2>
          <p className="text-sm">{order.customer.fullName}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.customer.email}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.customer.phone}</p>
        </div>
        <div>
          <h2 className="font-medium">Adresse</h2>
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
        <p className="mt-2 text-sm font-semibold">Total : {total.toFixed(2)} $ CAD</p>
      </section>

      <section>
        <h2 className="font-medium">Chronologie</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Payée le : {formatDate(order.createdAt)}</li>
          <li>Préparation démarrée le : {formatDate(order.preparingAt)}</li>
          <li>Prête pour retrait le : {formatDate(order.readyForPickupAt)}</li>
          <li>
            Date limite de retrait : {formatDate(order.pickupDeadlineAt)}
            {isOverdue ? " (dépassée)" : ""}
          </li>
          <li>Récupérée le : {formatDate(order.pickedUpAt)}</li>
          {order.cancelledAt ? (
            <>
              <li>Annulée le : {formatDate(order.cancelledAt)}</li>
              <li>Montant remboursé : {Number(order.refundAmountCAD ?? 0).toFixed(2)} $ CAD</li>
              <li>Frais d&apos;annulation retenus : {Number(order.cancellationFeeCAD ?? 0).toFixed(2)} $ CAD</li>
            </>
          ) : null}
        </ul>
      </section>

      {order.financialRecords.length > 0 ? (
        <section>
          <h2 className="font-medium">Registres financiers</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {order.financialRecords.map((record) => (
              <li key={record.id} className="flex justify-between">
                <span>
                  {FINANCIAL_TYPE_LABELS[record.type] ?? record.type} — {record.note}
                </span>
                <span className="font-medium">{Number(record.amountCAD).toFixed(2)} $ CAD</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {order.status === "paid" ? (
            <form action={boundPreparing}>
              <button
                type="submit"
                className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Marquer en préparation
              </button>
            </form>
          ) : null}

          {order.status === "preparing" ? (
            <form action={boundReady}>
              <button
                type="submit"
                className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Marquer prête pour retrait
              </button>
            </form>
          ) : null}

          {order.status === "ready_for_pickup" ? (
            <form action={boundPickedUp}>
              <button
                type="submit"
                className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Marquer récupérée
              </button>
            </form>
          ) : null}
        </div>

        {canCancel ? (
          <form action={boundCancel} className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10">
            <p className="text-sm font-medium">Annuler la commande</p>
            {order.status === "ready_for_pickup" ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="applyFee" defaultChecked />
                Appliquer les frais d&apos;annulation (client non venu chercher sa commande)
              </label>
            ) : null}
            <button
              type="submit"
              className="w-fit rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Annuler et rembourser
            </button>
          </form>
        ) : null}
      </section>

      {order.review ? (
        <section>
          <h2 className="font-medium">Avis du client</h2>
          <p className="mt-2 text-sm">
            {order.review.rating}/5 {order.review.published ? "(publié)" : "(en attente)"}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.review.comment}</p>
        </section>
      ) : null}
    </div>
  );
}
