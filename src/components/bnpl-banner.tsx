import { getTranslations } from "next-intl/server";
import { KlarnaWordmark } from "@/components/brand-marks";

export async function BnplBanner() {
  const t = await getTranslations("Payments");

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-[#FFB3C7] px-6 py-2 text-center text-sm font-semibold text-black">
      <span>{t("bannerText")}</span>
      <KlarnaWordmark />
    </div>
  );
}
