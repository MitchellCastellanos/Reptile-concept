import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { PrintButton } from "@/components/admin/print-button";
import { ReceiptEmailForm } from "./receipt-email-form";

const METHOD_LABELS: Record<string, string> = {
  cash: "Comptant",
  card: "Carte",
};

export default async function PosReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const [sale, settings] = await Promise.all([
    prisma.posSale.findUnique({
      where: { id },
      include: {
        items: { include: { animal: { include: { species: true } }, product: true } },
        createdByAdmin: true,
      },
    }),
    getStoreSettings(),
  ]);
  if (!sale) notFound();

  const subtotalCAD = Number(sale.subtotalCAD ?? 0);
  const gstAmountCAD = Number(sale.gstAmountCAD ?? 0);
  const qstAmountCAD = Number(sale.qstAmountCAD ?? 0);
  const totalCAD = Number(sale.amountCAD);

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex items-center justify-between">
        <Link href="/admin/pos" className="text-sm underline">
          ← Retour à la vente en magasin
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-md rounded-lg border border-black/10 p-6 text-sm dark:border-white/10">
        <div className="text-center">
          <p className="text-lg font-semibold">Reptiles Concept</p>
          <p className="text-zinc-600 dark:text-zinc-400">{settings.addressFr}</p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {settings.contactPhone} · {settings.contactEmail}
          </p>
          {settings.gstNumber ? (
            <p className="mt-1 text-xs text-zinc-500">TPS : {settings.gstNumber}</p>
          ) : null}
          {settings.qstNumber ? (
            <p className="text-xs text-zinc-500">TVQ : {settings.qstNumber}</p>
          ) : null}
        </div>

        <div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-xs text-zinc-500 dark:border-white/10">
          <span>Reçu #{sale.id.slice(0, 8)}</span>
          <span>{sale.createdAt.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
        <p className="text-xs text-zinc-500">
          Paiement : {METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod} · Caissier :{" "}
          {sale.createdByAdmin.email}
          {sale.customerName ? ` · Client : ${sale.customerName}` : ""}
        </p>

        <div className="overflow-x-auto">
<table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left dark:border-white/10">
              <th className="py-1">Article</th>
              <th className="py-1 text-center">Qté</th>
              <th className="py-1 text-right">Prix</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-1">
                  {item.animal ? `${item.animal.species.commonNameFr} — ${item.animal.morph}` : item.product?.nameFr}
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">
                  {(Number(item.priceAtSaleCAD) * item.quantity).toFixed(2)} $
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div>

        <div className="mt-4 flex flex-col gap-1 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Sous-total</span>
            <span>{subtotalCAD.toFixed(2)} $</span>
          </p>
          <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>TPS ({Number(settings.gstRatePercent)}%)</span>
            <span>{gstAmountCAD.toFixed(2)} $</span>
          </p>
          <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>TVQ ({Number(settings.qstRatePercent)}%)</span>
            <span>{qstAmountCAD.toFixed(2)} $</span>
          </p>
          <p className="flex justify-between border-t border-black/10 pt-2 text-base font-semibold dark:border-white/10">
            <span>Total</span>
            <span>{totalCAD.toFixed(2)} $ CAD</span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">Merci de votre visite!</p>
      </div>

      <div className="mx-auto w-full max-w-md">
        <ReceiptEmailForm posSaleId={sale.id} defaultEmail={sale.customerEmail ?? ""} />
      </div>
    </div>
  );
}
