import type { MetadataRoute } from "next";
import { TOP_LEVEL_PRODUCT } from "@/lib/product-variants";
import { prisma } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { HREFLANG, localizedUrl } from "@/lib/seo";

const STATIC_PATHS = ["", "/animals", "/boutique", "/reviews", "/faq", "/about"];

// Every URL lists all its language versions (hreflang) so search engines
// pair /fr and /en pages. Google ignores changeFrequency/priority, so they're
// omitted; lastModified is only set where we actually know it.
function entry(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[HREFLANG[l] ?? l] = localizedUrl(l, path);
  languages["x-default"] = localizedUrl(routing.defaultLocale, path);
  return routing.locales.map((locale) => ({
    url: localizedUrl(locale, path),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [animals, products, latestAnimal, latestProduct] = await Promise.all([
    prisma.animal.findMany({ where: { status: "available" }, select: { id: true, updatedAt: true } }),
    prisma.product.findMany({ where: { published: true, ...TOP_LEVEL_PRODUCT }, select: { id: true, updatedAt: true } }),
    prisma.animal.aggregate({ _max: { updatedAt: true } }),
    prisma.product.aggregate({ _max: { updatedAt: true } }),
  ]);

  const lastFor = (path: string): Date | undefined => {
    if (path === "/animals") return latestAnimal._max.updatedAt ?? undefined;
    if (path === "/boutique") return latestProduct._max.updatedAt ?? undefined;
    if (path === "") {
      const dates = [latestAnimal._max.updatedAt, latestProduct._max.updatedAt].filter((d): d is Date => !!d);
      return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
    }
    return undefined;
  };

  return [
    ...STATIC_PATHS.flatMap((path) => entry(path, lastFor(path))),
    ...animals.flatMap((a) => entry(`/animals/${a.id}`, a.updatedAt)),
    ...products.flatMap((p) => entry(`/boutique/${p.id}`, p.updatedAt)),
  ];
}
