import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { routing } from "@/i18n/routing";

// Private paths exist both bare and under each locale prefix (/fr/cart, /en/cart).
const PRIVATE_PATHS = ["/cart", "/checkout", "/account", "/search", "/reviews/new"];

export default function robots(): MetadataRoute.Robots {
  const localized = routing.locales.flatMap((l) => PRIVATE_PATHS.map((p) => `/${l}${p}`));
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/coming-soon", ...PRIVATE_PATHS, ...localized],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
