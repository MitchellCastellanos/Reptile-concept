/**
 * Single master CSV — full inventory for joint cleanup.
 * Run: npm run export:inventory-master
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { classifyItem } from "./inventory-classifier";

const OUT = join(process.cwd(), "exports", "inventaire-complet.csv");

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(values: (string | number)[]): string {
  return values.map(csvEscape).join(",");
}

async function main() {
  mkdirSync(join(process.cwd(), "exports"), { recursive: true });

  const [products, pending, animals, createdMeta] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ category: "asc" }, { nameFr: "asc" }] }),
    prisma.cloverImportCandidate.findMany({ where: { status: "pending" }, orderBy: { name: "asc" } }),
    prisma.animal.findMany({ include: { species: true }, orderBy: { createdAt: "desc" } }),
    prisma.cloverImportCandidate.findMany({
      where: { status: "created" },
      select: { cloverItemId: true, cloverCategoryName: true },
    }),
  ]);

  const cloverCatById = new Map(createdMeta.map((c) => [c.cloverItemId, c.cloverCategoryName ?? ""]));

  const headers = [
    "row_id",
    "source",
    "cloverItemId",
    "siteId",
    "name",
    "cloverCategory",
    "siteCategory",
    "queueStatus",
    "recordType",
    "confidence",
    "suggestedCloverCategory",
    "suggestedSiteCategory",
    "priceCAD",
    "stockQty",
    "published",
    "hasImage",
    "hasDescription",
    "brand",
    "cleanNameFr",
    "recommendedAction",
    "reason",
    "notes",
  ];

  const lines = [row(headers)];
  let n = 0;

  for (const p of products) {
    n++;
    const cloverCat = p.cloverItemId ? cloverCatById.get(p.cloverItemId) ?? "" : "";
    const c = classifyItem({ name: p.nameFr, cloverCategoryName: cloverCat || null, currentSiteCategory: p.category });
    lines.push(
      row([
        n,
        p.cloverItemId ? "site_product_clover" : "site_product_demo",
        p.cloverItemId ?? "",
        p.id,
        p.nameFr,
        cloverCat,
        p.category,
        "created",
        "product",
        c.confidence,
        c.suggestedCloverCategory,
        c.suggestedSiteCategory || p.category,
        Number(p.priceCAD).toFixed(2),
        p.stockQty,
        p.published ? "yes" : "no",
        p.imageUrl ? "yes" : "no",
        p.descriptionFr ? "yes" : "no",
        c.brand,
        c.cleanNameFr,
        p.published ? "enrichir / mantener" : "enrichir luego publicar",
        c.reason,
        "",
      ]),
    );
  }

  for (const item of pending) {
    n++;
    const c = classifyItem({ name: item.name, cloverCategoryName: item.cloverCategoryName });
    const action =
      c.recordType === "animal"
        ? "crear_animal"
        : c.recordType === "product"
          ? "bulk_create_product"
          : c.recordType === "ignore"
            ? "ignorar"
            : "revision_manual";
    lines.push(
      row([
        n,
        "clover_pending",
        item.cloverItemId,
        "",
        item.name,
        item.cloverCategoryName ?? "",
        "",
        "pending",
        c.recordType,
        c.confidence,
        c.suggestedCloverCategory,
        c.suggestedSiteCategory,
        Number(item.priceCAD).toFixed(2),
        item.stockCount ?? "",
        "no",
        "no",
        "no",
        c.brand,
        c.cleanNameFr,
        action,
        c.reason,
        "",
      ]),
    );
  }

  for (const a of animals) {
    n++;
    lines.push(
      row([
        n,
        a.cloverItemId ? "site_animal_clover" : "site_animal_demo",
        a.cloverItemId ?? "",
        a.id,
        a.species?.nameFr ?? a.id,
        "",
        "animal",
        a.status,
        "animal",
        "high",
        "",
        "",
        Number(a.priceCAD).toFixed(2),
        a.status === "available" ? 1 : 0,
        a.status === "available" ? "yes" : "no",
        "check",
        "check",
        "",
        "",
        "ficha_animal",
        "",
        "",
      ]),
    );
  }

  writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log(`Wrote ${n} rows → ${OUT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
