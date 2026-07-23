import Link from "next/link";
import { prisma } from "@/lib/db";
import { expireOverduePickups } from "@/lib/order-expiration";

const STATUS_LABELS: Record<string, string> = {
  paid: "Payée",
  preparing: "En préparation",
  ready_for_pickup: "Prête pour retrait",
  picked_up: "Récupérée",
  cancelled: "Annulée",
  refunded: "Annulée / remboursée",
};

export default async function AdminOrdersPage() {
  await expireOverduePickups();

  const orders = await prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Commandes</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Client</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Date limite de retrait</th>
            <th className="py-2">Créée le</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isOverdue =
              order.status === "ready_for_pickup" &&
              order.pickupDeadlineAt !== null &&
              order.pickupDeadlineAt < new Date();
            return (
              <tr key={order.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2">{order.customer.fullName}</td>
                <td className="py-2">{STATUS_LABELS[order.status] ?? order.status}</td>
                <td className={`py-2 ${isOverdue ? "font-medium text-red-600" : ""}`}>
                  {order.pickupDeadlineAt
                    ? order.pickupDeadlineAt.toLocaleDateString("fr-CA")
                    : "—"}
                </td>
                <td className="py-2">{order.createdAt.toLocaleDateString("fr-CA")}</td>
                <td className="py-2">
                  <Link href={`/admin/orders/${order.id}`} className="underline">
                    Détails
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
