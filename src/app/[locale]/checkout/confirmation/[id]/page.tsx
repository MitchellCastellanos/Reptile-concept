import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PaymentBadges } from "@/components/payment-badges";
import { resolveOrderAmounts } from "@/lib/orders";
import { syncOrderFromCheckoutSessionId } from "@/lib/stripe-fulfillment";
import { ClearCartOnMount } from "./clear-cart-on-mount";

export default async function CheckoutConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  if (sessionId) {
    await syncOrderFromCheckoutSessionId(sessionId);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { animal: true, product: true } } },
  });
  if (!order) notFound();

  const t = await getTranslations("Checkout");
  const amounts = resolveOrderAmounts(order);
  const isPending = order.status === "pending_payment";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <ClearCartOnMount />
      <h1 className="text-3xl font-semibold tracking-tight">
        {isPending ? t("paymentPendingTitle") : t("confirmationTitle")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {isPending ? t("paymentPendingBody") : t("confirmationBody")} #{order.id.slice(0, 8)}
      </p>

      <ul className="flex flex-col gap-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.animal ? item.animal.morph : item.product?.nameFr} × {item.quantity} —{" "}
            {Number(item.priceAtSaleCAD)} $
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
        <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>{t("subtotal")}</span>
          <span>{amounts.subtotalCAD.toFixed(2)} $</span>
        </p>
        <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>{t("gst")}</span>
          <span>{amounts.gstAmountCAD.toFixed(2)} $</span>
        </p>
        <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>{t("qst")}</span>
          <span>{amounts.qstAmountCAD.toFixed(2)} $</span>
        </p>
        <p className="flex justify-between font-medium">
          <span>{t("total")}</span>
          <span>{amounts.totalCAD.toFixed(2)} $ CAD</span>
        </p>
      </div>

      {!isPending ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("nextSteps")}</p>
      ) : null}

      <PaymentBadges />
    </main>
  );
}
