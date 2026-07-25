import Image from "next/image";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PaymentBadges } from "@/components/payment-badges";
import { AmexMark, MastercardMark, VisaMark } from "@/components/brand-marks";
import { getStoreSettings } from "@/lib/settings";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();
  const settings = await getStoreSettings();
  const address = locale === "en" ? settings.addressEn : settings.addressFr;
  const hours = locale === "en" ? settings.hoursEn : settings.hoursFr;

  return (
    <footer className="mt-auto border-t border-border bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-1">
              <Image src="/icon.png" alt="" width={20} height={20} className="h-full w-full" />
            </span>
            <p className="text-lg font-semibold">Reptile Concept</p>
          </div>
          <p className="text-sm text-white/80">{t("tagline")}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("visit")}</p>
          <p className="text-white/80">{address}</p>
          <p className="text-white/80">{hours}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("contact")}</p>
          <a href={`mailto:${settings.contactEmail}`} className="text-white/80 hover:text-white">
            {settings.contactEmail}
          </a>
          <p className="text-white/80">{settings.contactPhone}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("links")}</p>
          <Link href="/animals" className="text-white/80 hover:text-white">
            {t("animals")}
          </Link>
          <Link href="/boutique" className="text-white/80 hover:text-white">
            {t("boutique")}
          </Link>
          <Link href="/cart" className="text-white/80 hover:text-white">
            {t("cart")}
          </Link>
          <Link href="/reviews" className="text-white/80 hover:text-white">
            {t("reviews")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-white/20 px-6 py-6">
        <PaymentBadges variant="onDark" className="w-fit" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/60">{t("cardsAccepted")}</span>
          <VisaMark />
          <MastercardMark />
          <AmexMark />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/20 px-6 py-4 text-center text-xs text-white/60 sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} Reptile Concept — {t("rights")}
        </span>
        <NextLink href="/admin/login" className="text-white/40 hover:text-white/70">
          {t("staff")}
        </NextLink>
      </div>
    </footer>
  );
}
