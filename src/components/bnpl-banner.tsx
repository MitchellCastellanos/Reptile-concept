import { getTranslations } from "next-intl/server";
import { KlarnaWordmark } from "@/components/brand-marks";

export async function BnplBanner() {
  const t = await getTranslations("Payments");

  return (
    <p className="bg-[#FFB3C7] px-6 py-1.5 text-center text-xs font-semibold leading-snug text-black sm:text-sm">
      <span className="sm:hidden">{t("bannerTextShort")}</span>
      <span className="hidden sm:inline">{t("bannerText")}</span>{" "}
      <KlarnaWordmark className="align-middle" />
    </p>
  );
}
