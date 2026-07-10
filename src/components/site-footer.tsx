import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-auto border-t border-border bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Reptile Concept</p>
          <p className="text-sm text-white/80">{t("tagline")}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("visit")}</p>
          <p className="text-white/80">{t("address")}</p>
          <p className="text-white/80">{t("hours")}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">{t("contact")}</p>
          <a href="mailto:contact@reptileconcept.ca" className="text-white/80 hover:text-white">
            contact@reptileconcept.ca
          </a>
          <p className="text-white/80">{t("phone")}</p>
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
