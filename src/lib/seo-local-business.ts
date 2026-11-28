import { getStoreSettings } from "@/lib/settings";
import { DAY_ORDER, parseWeeklyHours, type DayKey } from "@/lib/business-hours";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

const SCHEMA_DAY: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// Organization-level structured data (PetStore + WebSite) built from the
// admin-editable store settings so it can't drift from the footer.
export async function getSiteJsonLd(locale: string) {
  const settings = await getStoreSettings();
  const weekly = parseWeeklyHours(settings.weeklyHours);
  const address = locale === "en" ? settings.addressEn : settings.addressFr;
  const base = absoluteUrl("");

  const openingHoursSpecification = DAY_ORDER.filter((d) => !weekly[d].closed).map((d) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${SCHEMA_DAY[d]}`,
    opens: weekly[d].start,
    closes: weekly[d].end,
  }));

  return [
    {
      "@context": "https://schema.org",
      "@type": "PetStore",
      "@id": `${base}/#store`,
      name: SITE_NAME,
      url: `${base}/${locale}`,
      image: absoluteUrl("/og-image.jpg"),
      logo: absoluteUrl("/logo.png"),
      telephone: settings.contactPhone,
      email: settings.contactEmail,
      description:
        locale === "en"
          ? "Reptiles, terrariums and supplies — responsible breeding in Lachine, Montreal, Quebec."
          : "Reptiles, terrariums et accessoires — élevage responsable à Lachine, Montréal, Québec.",
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        addressLocality: "Lachine",
        addressRegion: "QC",
        addressCountry: "CA",
      },
      areaServed: "Montréal, QC",
      currenciesAccepted: "CAD",
      ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
      ...(settings.facebookUrl ? { sameAs: [settings.facebookUrl] } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: SITE_NAME,
      url: base,
      inLanguage: ["fr-CA", "en-CA"],
      publisher: { "@id": `${base}/#store` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/${locale}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
