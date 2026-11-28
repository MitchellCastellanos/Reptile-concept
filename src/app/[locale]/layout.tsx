import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteNavWrapper } from "@/components/site-nav-wrapper";
import { SiteFooter } from "@/components/site-footer";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { BnplBanner } from "@/components/bnpl-banner";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { BackToTopButton } from "@/components/back-to-top-button";
import { PageViewTracker } from "@/components/page-view-tracker";
import { MiniCartPopover } from "@/components/mini-cart-popover";
import { CartProvider } from "@/lib/cart-context";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_NAME, OG_LOCALE, jsonLdString } from "@/lib/seo";
import { getSiteJsonLd } from "@/lib/seo-local-business";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif for hero headlines (warmer/more distinctive than Geist).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description =
    locale === "en"
      ? "Reptiles, terrariums and supplies — responsible breeding in Lachine, Montreal, QC."
      : "Reptiles, terrariums et accessoires — élevage responsable à Lachine (Montréal), QC.";
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `${SITE_NAME} — ${locale === "en" ? "Reptile shop in Lachine, Montreal" : "Boutique de reptiles à Lachine, Montréal"}`, template: `%s | ${SITE_NAME}` },
    description,
    openGraph: {
      title: SITE_NAME,
      description,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? locale,
      type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  // Structured data must never take the whole site down if settings can't load.
  const siteJsonLd = await getSiteJsonLd(locale).catch(() => null);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {siteJsonLd ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd) }} />
        ) : null}
        <NextIntlClientProvider>
          <CartProvider>
            <PageViewTracker />
            <BnplBanner />
            <AnnouncementBanner />
            <SiteNavWrapper />
            {children}
            <SiteFooter />
            <CookieConsentBanner />
            <BackToTopButton />
            <MiniCartPopover />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
