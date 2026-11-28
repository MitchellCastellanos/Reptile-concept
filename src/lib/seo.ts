import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site-url";

export const SITE_NAME = "Reptiles Concept";

// BCP 47 tags used for hreflang / og:locale.
export const HREFLANG: Record<string, string> = { fr: "fr-CA", en: "en-CA" };
export const OG_LOCALE: Record<string, string> = { fr: "fr_CA", en: "en_CA" };

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path}`;
}

// `path` is locale-less ("" for home, "/boutique/abc" otherwise).
export function localizedUrl(locale: string, path = ""): string {
  return absoluteUrl(`/${locale}${path}`);
}

export function localizedAlternates(locale: string, path = ""): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[HREFLANG[l] ?? l] = localizedUrl(l, path);
  languages["x-default"] = localizedUrl(routing.defaultLocale, path);
  return { canonical: localizedUrl(locale, path), languages };
}

type PageMetaInput = {
  locale: string;
  path?: string;
  title: string;
  description: string;
  noindex?: boolean;
};

// Shared metadata for ordinary pages: title (the layout adds the site-name
// suffix), description, canonical + hreflang and matching OG/Twitter tags.
export function buildPageMetadata({ locale, path = "", title, description, noindex }: PageMetaInput): Metadata {
  const url = localizedUrl(locale, path);
  return {
    title,
    description,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? locale,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// For private/transactional pages that must never be indexed.
export const NOINDEX_METADATA: Metadata = { robots: { index: false, follow: false } };

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// JSON.stringify output is placed inside a <script>; escape "<" so a value
// containing "</script>" can't break out of it.
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Structured-data images must be absolute URLs.
export function absoluteImage(url: string): string {
  return /^https?:\/\//.test(url) ? url : absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}
