import Image from "next/image";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PaymentBadges } from "@/components/payment-badges";
import { AmexMark, FacebookMark, MastercardMark, VisaMark } from "@/components/brand-marks";
import { getStoreSettings } from "@/lib/settings";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tLegal = await getTranslations("Legal");
  const locale = await getLocale();
  const settings = await getStoreSettings();
  const address = locale === "en" ? settings.addressEn : settings.addressFr;
  const hours = locale === "en" ? settings.hoursEn : settings.hoursFr;
  const followerCount =
    settings.facebookFollowerCount != null
      ? new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { notation: "compact" }).format(
          settings.facebookFollowerCount,
        )
      : null;

  return (
    <footer className="mt-auto border-t border-border bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-1">
              <Image src="/icon.png" alt="" width={20} height={20} className="h-full w-full" />
            </span>
            <p className="text-lg font-semibold">Reptiles Concept</p>
          </div>
          <p className="text-sm text-white/80">{t("tagline")}</p>
          <NewsletterSignupForm />

          {settings.facebookUrl ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t("followUs")}</p>
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm text-white/90 transition hover:bg-white/20"
              >
                <FacebookMark />
                <span>
                  Facebook
                  {followerCount ? (
                    <span className="text-white/60"> · {t("followerCount", { count: followerCount })}</span>
                  ) : null}
                </span>
              </a>
            </div>
          ) : null}
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
          <Link href="/faq" className="text-white/80 hover:text-white">
            {t("faq")}
          </Link>
          <Link href="/about" className="text-white/80 hover:text-white">
            {t("about")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-white/20 px-6 py-6">
        <PaymentBadges variant="onDark" className="w-fit justify-center" />
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-medium text-white/60">{t("cardsAccepted")}</span>
          <VisaMark />
          <MastercardMark />
          <AmexMark />
        </div>
      </div>

      <div className="border-t border-white/20 px-6 py-8">
        <a
          href="https://digital.gabansolutions.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="group mx-auto flex w-fit flex-col items-center gap-3 text-center transition-opacity hover:opacity-90"
        >
          <Image
            src="/images/apple-touch-icon.png"
            alt="GABAN Solutions"
            width={32}
            height={32}
            className="rounded-lg shadow-lg ring-1 ring-white/25"
          />
          <span className="max-w-xs text-sm leading-snug text-white/55 group-hover:text-white/75">
            {t("craftedInMontreal")}{" "}
            <span className="font-semibold tracking-wide text-white/90 group-hover:text-white">
              GABAN Solutions
            </span>
          </span>
        </a>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/20 px-6 py-4 text-center text-xs text-white/60 sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} Reptiles Concept — {t("rights")}
        </span>
        <div className="flex items-center gap-4">
          <Link href="/legal/cookies" className="text-white/40 hover:text-white/70">
            {tLegal("cookiePolicyLink")}
          </Link>
          <NextLink href="/admin/login" className="text-white/40 hover:text-white/70">
            {t("staff")}
          </NextLink>
        </div>
      </div>
    </footer>
  );
}
