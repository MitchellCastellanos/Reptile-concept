import Link from "next/link";
import { prisma } from "@/lib/db";

const TYPE_LABELS: Record<string, string> = {
  sale: "Vente",
  refund: "Remboursement",
  cancellation_fee: "Frais d'annulation",
};

export default async function AdminFinancePage() {
  const records = await prisma.financialRecord.findMany({
    include: { order: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totals = records.reduce(
    (acc, record) => {
      const amount = Number(record.amountCAD);
      if (record.type === "sale") acc.sales += amount;
      if (record.type === "refund") acc.refunds += amount;
      if (record.type === "cancellation_fee") acc.fees += amount;
      return acc;
    },
    { sales: 0, refunds: 0, fees: 0 },
  );
  const net = totals.sales - totals.refunds + totals.fees;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Finances</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{totals.sales.toFixed(2)} $</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Ventes</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{totals.refunds.toFixed(2)} $</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Remboursements</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{totals.fees.toFixed(2)} $</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Frais d&apos;annulation</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{net.toFixed(2)} $</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Net</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Date</th>
            <th className="py-2">Type</th>
            <th className="py-2">Commande</th>
            <th className="py-2">Client</th>
            <th className="py-2">Note</th>
            <th className="py-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{record.createdAt.toLocaleDateString("fr-CA")}</td>
              <td className="py-2">{TYPE_LABELS[record.type] ?? record.type}</td>
              <td className="py-2">
                <Link href={`/admin/orders/${record.orderId}`} className="underline">
                  #{record.orderId.slice(0, 8)}
                </Link>
              </td>
              <td className="py-2">{record.order.customer.fullName}</td>
              <td className="py-2 text-zinc-600 dark:text-zinc-400">{record.note}</td>
              <td className="py-2 text-right">{Number(record.amountCAD).toFixed(2)} $</td>
            </tr>
          ))}
        </tbody>
      </table>

      {records.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun mouvement financier pour le moment.</p>
      ) : null}
    </div>
  );
}
