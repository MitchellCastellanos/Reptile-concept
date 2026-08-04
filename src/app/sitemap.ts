import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { routing } from "@/i18n/routing";

const STATIC_PATHS = ["", "/animals", "/boutique", "/reviews", "/faq", "/about"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [animals, products] = await Promise.all([
    prisma.animal.findMany({ where: { status: "available" }, select: { id: true, updatedAt: true } }),
    prisma.product.findMany({ where: { published: true }, select: { id: true, updatedAt: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${siteUrl}/${locale}${path}`, changeFrequency: "daily", priority: path === "" ? 1 : 0.7 });
    }
    for (const animal of animals) {
      entries.push({
        url: `${siteUrl}/${locale}/animals/${animal.id}`,
        lastModified: animal.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    for (const product of products) {
      entries.push({
        url: `${siteUrl}/${locale}/boutique/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
