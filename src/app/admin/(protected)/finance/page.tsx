import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const TYPE_LABELS: Record<string, string> = {
  sale: "Vente",
  refund: "Remboursement",
  cancellation_fee: "Frais d'annulation",
};

const CHANNEL_LABELS: Record<string, string> = {
  online: "En ligne",
  in_store: "En magasin",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Comptant",
  card: "Carte",
};

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string; channel?: string; method?: string }>;
}) {
  const params = await searchParams;

  const where: Prisma.FinancialRecordWhereInput = {};
  if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    if (year && month) {
      where.createdAt = {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month, 1)),
      };
    }
  }
  if (params.type) where.type = params.type as Prisma.EnumFinancialRecordTypeFilter["equals"];
  if (params.channel) where.channel = params.channel as Prisma.EnumFinancialChannelFilter["equals"];
  if (params.method) where.paymentMethod = params.method as Prisma.EnumPosPaymentMethodFilter["equals"];

  const records = await prisma.financialRecord.findMany({
    where,
    include: {
      order: { include: { customer: true } },
      posSale: { include: { createdByAdmin: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = records.reduce(
    (acc, record) => {
      const amount = Number(record.amountCAD);
      if (record.type === "sale") acc.sales += amount;
      if (record.type === "refund") acc.refunds += amount;
      if (record.type === "cancellation_fee") acc.fees += amount;
      if (record.channel === "in_store" && record.paymentMethod === "cash" && record.type === "sale") {
        acc.pettyCash += amount;
      }
      return acc;
    },
    { sales: 0, refunds: 0, fees: 0, pettyCash: 0 },
  );
  const net = totals.sales - totals.refunds + totals.fees;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Finances</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-2xl font-semibold">{totals.pettyCash.toFixed(2)} $</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Petite caisse (comptant)</p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          Mois
          <input
            type="month"
            name="month"
            defaultValue={params.month}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1">
          Type
          <select
            name="type"
            defaultValue={params.type ?? ""}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            <option value="">Tous</option>
            <option value="sale">Vente</option>
            <option value="refund">Remboursement</option>
            <option value="cancellation_fee">Frais d&apos;annulation</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Canal
          <select
            name="channel"
            defaultValue={params.channel ?? ""}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            <option value="">Tous</option>
            <option value="online">En ligne</option>
            <option value="in_store">En magasin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Méthode de paiement
          <select
            name="method"
            defaultValue={params.method ?? ""}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            <option value="">Toutes</option>
            <option value="cash">Comptant</option>
            <option value="card">Carte</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Filtrer
        </button>
        <Link href="/admin/finance" className="text-sm underline">
          Réinitialiser
        </Link>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">Date</th>
            <th className="py-2">Type</th>
            <th className="py-2">Canal</th>
            <th className="py-2">Méthode</th>
            <th className="py-2">Référence</th>
            <th className="py-2">Note</th>
            <th className="py-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{record.createdAt.toLocaleDateString("fr-CA")}</td>
              <td className="py-2">{TYPE_LABELS[record.type] ?? record.type}</td>
              <td className="py-2">{CHANNEL_LABELS[record.channel] ?? record.channel}</td>
              <td className="py-2">
                {record.paymentMethod ? (METHOD_LABELS[record.paymentMethod] ?? record.paymentMethod) : "—"}
              </td>
              <td className="py-2">
                {record.orderId ? (
                  <Link href={`/admin/orders/${record.orderId}`} className="underline">
                    #{record.orderId.slice(0, 8)} — {record.order?.customer.fullName}
                  </Link>
                ) : record.posSaleId ? (
                  <span>
                    Vente en magasin #{record.posSaleId.slice(0, 8)} ({record.posSale?.createdByAdmin.email})
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2 text-zinc-600 dark:text-zinc-400">{record.note}</td>
              <td className="py-2 text-right">{Number(record.amountCAD).toFixed(2)} $</td>
            </tr>
          ))}
        </tbody>
      </table>

      {records.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucun mouvement financier pour ces filtres.</p>
      ) : null}
    </div>
  );
}
