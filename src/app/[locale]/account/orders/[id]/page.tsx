import { getLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

const TIMELINE_STEPS = [
  { key: "paid", dateField: "createdAt" as const },
  { key: "preparing", dateField: "preparingAt" as const },
  { key: "ready_for_pickup", dateField: "readyForPickupAt" as const },
  { key: "picked_up", dateField: "pickedUpAt" as const },
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const order = await prisma.order.findFirst({
    where: { id, customerId: customer.id },
    include: { items: { include: { animal: { include: { species: true } }, product: true } }, shippingAddress: true },
  });
  if (!order) notFound();

  const locale = await getLocale();
  const t = await getTranslations("Account");
  const dateLocale = locale === "en" ? "en-CA" : "fr-CA";
  const total = order.items.reduce((sum, item) => sum + Number(item.priceAtSaleCAD) * item.quantity, 0);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/account" className="w-fit text-sm font-medium text-primary hover:underline">
          &larr; {t("backToAccount")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("orderNumber")} #{order.id.slice(0, 8)}
        </h1>
        <p className="text-sm text-muted">
          {order.createdAt.toLocaleDateString(dateLocale, { dateStyle: "long" })}
        </p>
      </div>

      {isCancelled ? (
        <p className="rounded-xl border border-border bg-accent-light px-4 py-3 text-sm text-foreground/80">
          {t(order.status === "refunded" ? "orderRefunded" : "orderCancelled")}
        </p>
      ) : (
        <ol className="flex flex-col gap-0">
          {TIMELINE_STEPS.map((step, i) => {
            const date = order[step.dateField] as Date | null;
            const reached = Boolean(date) || (step.key === "paid" && order.status !== "pending_payment");
            const isLast = i === TIMELINE_STEPS.length - 1;
            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      reached ? "bg-primary text-white" : "bg-accent-light text-muted"
                    }`}
                  >
                    {reached ? "✓" : i + 1}
                  </span>
                  {!isLast ? (
                    <span className={`w-0.5 flex-1 ${reached ? "bg-primary" : "bg-border"}`} style={{ minHeight: 32 }} />
                  ) : null}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-medium ${reached ? "text-foreground" : "text-muted"}`}>
                    {t(`timeline_${step.key}`)}
                  </p>
                  {date ? (
                    <p className="text-xs text-muted">{date.toLocaleString(dateLocale, { dateStyle: "medium", timeStyle: "short" })}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("orderItems")}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {order.items.map((item) => {
            const name = item.animal
              ? `${locale === "en" ? item.animal.species.commonNameEn : item.animal.species.commonNameFr} — ${item.animal.morph}`
              : locale === "en"
                ? item.product?.nameEn
                : item.product?.nameFr;
            return (
              <li key={item.id} className="flex justify-between">
                <span>
                  {name} {item.quantity > 1 ? `× ${item.quantity}` : ""}
                </span>
                <span>{(Number(item.priceAtSaleCAD) * item.quantity).toFixed(2)} $</span>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
          <span>{t("orderTotal")}</span>
          <span>{total.toFixed(2)} $ CAD</span>
        </div>
      </section>

      <section className="flex flex-col gap-1 text-sm text-muted">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("shippingAddress")}</h2>
        <p>{order.shippingAddress.street}</p>
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
        </p>
      </section>
    </main>
  );
}
