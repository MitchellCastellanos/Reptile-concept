import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PaymentBadges } from "@/components/payment-badges";
import { ClearCartOnMount } from "./clear-cart-on-mount";

export default async function CheckoutConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { animal: true, product: true } } },
  });
  if (!order) notFound();

  const t = await getTranslations("Checkout");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <ClearCartOnMount />
      <h1 className="text-3xl font-semibold tracking-tight">{t("confirmationTitle")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {t("confirmationBody")} #{order.id.slice(0, 8)}
      </p>

      <ul className="flex flex-col gap-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.animal ? item.animal.morph : item.product?.nameFr} × {item.quantity} —{" "}
            {Number(item.priceAtSaleCAD)} $
          </li>
        ))}
      </ul>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("nextSteps")}</p>

      <PaymentBadges />
    </main>
  );
}
