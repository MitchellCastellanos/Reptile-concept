import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { logoutAction } from "./actions";

const STATUS_LABELS: Record<string, { fr: string; en: string }> = {
  paid: { fr: "Payée", en: "Paid" },
  preparing: { fr: "En préparation", en: "Preparing" },
  ready_for_pickup: { fr: "Prête pour retrait", en: "Ready for pickup" },
  picked_up: { fr: "Récupérée", en: "Picked up" },
  cancelled: { fr: "Annulée", en: "Cancelled" },
  refunded: { fr: "Remboursée", en: "Refunded" },
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const t = await getTranslations("Account");
  const locale = await getLocale();

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: { include: { animal: true, product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("welcomeBack")}</h1>
          <p className="text-muted">{customer.fullName}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm font-medium text-primary hover:underline">
            {t("logout")}
          </button>
        </form>
      </div>

      <Link href="/account/wishlist" className="w-fit text-sm font-medium text-primary hover:underline">
        {t("myWishlist")} &rarr;
      </Link>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("myOrders")}</h2>
        {orders.length === 0 ? (
          <p className="text-muted">{t("noOrders")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => {
              const label = STATUS_LABELS[order.status];
              const total = order.items.reduce(
                (sum, item) => sum + Number(item.priceAtSaleCAD) * item.quantity,
                0,
              );
              return (
                <li
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {t("orderNumber")} #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted">
                      {order.createdAt.toLocaleDateString(locale === "en" ? "en-CA" : "fr-CA")} &middot;{" "}
                      {total.toFixed(2)} $ CAD
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent">
                    {locale === "en" ? (label?.en ?? order.status) : (label?.fr ?? order.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
