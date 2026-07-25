import { getStoreSettings } from "@/lib/settings";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <CheckoutForm
      gstRatePercent={Number(settings.gstRatePercent)}
      qstRatePercent={Number(settings.qstRatePercent)}
    />
  );
}
