import { getTranslations } from "next-intl/server";
import { getStoreSettings } from "@/lib/settings";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const settings = await getStoreSettings();
  const { cancelled } = await searchParams;
  const t = await getTranslations("Checkout");

  return (
    <>
      {cancelled ? (
        <div className="mx-auto w-full max-w-2xl px-6 pt-8">
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            {t("paymentCancelled")}
          </p>
        </div>
      ) : null}
      <CheckoutForm
        gstRatePercent={Number(settings.gstRatePercent)}
        qstRatePercent={Number(settings.qstRatePercent)}
      />
    </>
  );
}
