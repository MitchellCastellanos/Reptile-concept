import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getStoreSettings } from "@/lib/queries";

const HOURS_ROWS = [
  { day: "mon", field: "hoursMon" },
  { day: "tue", field: "hoursTue" },
  { day: "wed", field: "hoursWed" },
  { day: "thu", field: "hoursThu" },
  { day: "fri", field: "hoursFri" },
  { day: "sat", field: "hoursSat" },
  { day: "sun", field: "hoursSun" },
] as const;

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();
  const settings = await getStoreSettings();
  const address = locale === "en" ? settings.addressEn : settings.addressFr;

  return (
    <footer className="mt-auto border-t border-border bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Reptile Concept</p>
          <p className="text-sm text-white/80">{t("tagline")}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("visit")}</p>
          <p className="text-white/80">{address}</p>
          <ul className="flex flex-col gap-0.5 text-white/80">
            {HOURS_ROWS.map(({ day, field }) => (
              <li key={day} className="flex justify-between gap-4">
                <span>{t(`day_${day}`)}</span>
                <span>{settings[field]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("contact")}</p>
          <a href="mailto:contact@reptileconcept.ca" className="text-white/80 hover:text-white">
            contact@reptileconcept.ca
          </a>
          <a
            href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
            className="text-white/80 hover:text-white"
          >
            {settings.phone}
          </a>
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
        </div>
      </div>

      <div className="border-t border-white/20 px-6 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Reptile Concept — {t("rights")}
      </div>
    </footer>
  );
}
