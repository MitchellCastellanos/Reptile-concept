import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { logoutAction } from "./actions";

const STATUS_LABELS: Record<string, { fr: string; en: string }> = {
  pending_payment: { fr: "En attente de paiement", en: "Awaiting payment" },
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

  const wishlistCount = await prisma.wishlistItem.count({ where: { customerId: customer.id } });

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

      <div className="flex w-fit items-center gap-3 rounded-2xl border border-border bg-accent-light px-5 py-4 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 16.9l-6.2 3.4 1.6-6.8L2.2 8.9l6.9-.6z" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="font-semibold">{t("loyaltyPoints", { count: customer.loyaltyPoints })}</p>
          <p className="text-sm text-muted">{t("loyaltyPointsHint")}</p>
        </div>
      </div>

      <Link
        href="/account/wishlist"
        className="flex w-fit items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition hover:border-primary/30"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-4.35-9.33-8.5C.67 9.15 2.73 5.5 6.5 5.5c2.04 0 3.28 1.18 3.78 2.22C10.78 6.68 12.02 5.5 14.06 5.5 17.83 5.5 19.89 9.15 21.33 12.5 19 16.65 12 21 12 21z" />
        </svg>
        <div>
          <p className="font-semibold">{t("myWishlist")}</p>
          <p className="text-sm text-muted">
            {wishlistCount === 0
              ? t("noWishlist")
              : t("wishlistItemCount", { count: wishlistCount })}
          </p>
        </div>
        <span className="ml-2 text-primary">&rarr;</span>
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
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30"
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
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
