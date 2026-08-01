/**
 * Export CSV files for inventory cleanup review.
 * Run: npx tsx --tsconfig tsconfig.json scripts/export-inventory-review.ts
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { classifyItem, getCloverToSiteMapping } from "./inventory-classifier";

const OUT_DIR = join(process.cwd(), "exports", "inventory-review");

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: Record<string, string | number>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const [pending, products, createdCandidates] = await Promise.all([
    prisma.cloverImportCandidate.findMany({
      where: { status: "pending" },
      orderBy: [{ cloverCategoryName: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: { cloverItemId: { not: null } },
      orderBy: [{ category: "asc" }, { nameFr: "asc" }],
    }),
    prisma.cloverImportCandidate.findMany({
      where: { status: "created" },
      select: { cloverItemId: true, cloverCategoryName: true, name: true },
    }),
  ]);

  const cloverCatByItemId = new Map(createdCandidates.map((c) => [c.cloverItemId, c.cloverCategoryName]));

  // ── 1. Pending items with suggestions ──
  const pendingRows = pending.map((item) => {
    const c = classifyItem({ name: item.name, cloverCategoryName: item.cloverCategoryName });
    const cloverChange =
      !item.cloverCategoryName && c.suggestedCloverCategory
        ? `Asignar "${c.suggestedCloverCategory}" en Clover`
        : item.cloverCategoryName
          ? "Mantener"
          : "Revisar manual";

    return {
      cloverItemId: item.cloverItemId,
      name: item.name,
      cloverCategory: item.cloverCategoryName ?? "(sans catégorie)",
      priceCAD: Number(item.priceCAD).toFixed(2),
      stockCount: item.stockCount ?? "",
      recordType: c.recordType,
      suggestedSiteCategory: c.suggestedSiteCategory,
      suggestedCloverCategory: c.suggestedCloverCategory,
      cloverChange,
      confidence: c.confidence,
      brand: c.brand,
      cleanNameFr: c.cleanNameFr,
      reason: c.reason,
      action: c.recordType === "animal"
        ? "Créer Animal (no Product)"
        : c.recordType === "ignore"
          ? "Ignorer / no publicar"
          : c.recordType === "product"
            ? "Bulk create Product"
            : "Revisión manual",
    };
  });

  writeFileSync(
    join(OUT_DIR, "01-pending-with-suggestions.csv"),
    toCsv(
      [
        "cloverItemId", "name", "cloverCategory", "priceCAD", "stockCount",
        "recordType", "suggestedSiteCategory", "suggestedCloverCategory", "cloverChange",
        "confidence", "brand", "cleanNameFr", "reason", "action",
      ],
      pendingRows,
    ),
    "utf8",
  );

  // ── 2. Summary by suggested batch (for bulk triage) ──
  const batchMap = new Map<string, { count: number; confidence: string; recordType: string; site: string; clover: string }>();
  for (const row of pendingRows) {
    const key = `${row.recordType}|${row.suggestedCloverCategory}|${row.suggestedSiteCategory}|${row.cloverChange}`;
    const existing = batchMap.get(key);
    if (existing) existing.count++;
    else batchMap.set(key, {
      count: 1,
      confidence: row.confidence,
      recordType: row.recordType,
      site: row.suggestedSiteCategory,
      clover: row.suggestedCloverCategory,
    });
  }

  const batchRows = [...batchMap.entries()]
    .map(([key, v]) => ({
      batchKey: key,
      count: v.count,
      recordType: v.recordType,
      suggestedCloverCategory: v.clover,
      suggestedSiteCategory: v.site,
      confidence: v.confidence,
      recommendedAction:
        v.recordType === "animal"
          ? "Pipeline animaux — mantener categoría Clover"
          : v.recordType === "product"
            ? `Bulk create como ${v.site || "?"} + opcional asignar Clover "${v.clover}"`
            : v.recordType === "ignore"
              ? "Bulk ignore"
              : "Revisar lote manualmente",
    }))
    .sort((a, b) => b.count - a.count);

  writeFileSync(
    join(OUT_DIR, "02-batch-triage-summary.csv"),
    toCsv(
      ["batchKey", "count", "recordType", "suggestedCloverCategory", "suggestedSiteCategory", "confidence", "recommendedAction"],
      batchRows,
    ),
    "utf8",
  );

  // ── 3. Clover → Site mapping (minimal change strategy) ──
  const mappingRows = getCloverToSiteMapping().map((m) => ({
    cloverCategory: m.cloverCategory,
    siteCategory: m.siteCategory,
    recommendedAction: m.action,
    changeClover: m.changeClover,
    approxPendingOrCreated: m.itemCount ?? "",
  }));

  writeFileSync(
    join(OUT_DIR, "03-clover-to-site-mapping.csv"),
    toCsv(
      ["cloverCategory", "siteCategory", "recommendedAction", "changeClover", "approxPendingOrCreated"],
      mappingRows,
    ),
    "utf8",
  );

  // ── 4. Existing products — enrichment checklist ──
  const productRows = products.map((p) => {
    const cloverCat = p.cloverItemId ? cloverCatByItemId.get(p.cloverItemId) ?? "" : "";
    const c = classifyItem({ name: p.nameFr, cloverCategoryName: cloverCat || null, currentSiteCategory: p.category });
    const needsRecat = c.suggestedSiteCategory && c.suggestedSiteCategory !== p.category ? "SÍ" : "No";

    return {
      productId: p.id,
      cloverItemId: p.cloverItemId ?? "",
      nameFr: p.nameFr,
      currentSiteCategory: p.category,
      cloverCategory: cloverCat,
      suggestedSiteCategory: c.suggestedSiteCategory,
      needsRecategorization: needsRecat,
      stockQty: p.stockQty,
      hasDescription: p.descriptionFr ? "Sí" : "No",
      hasImage: p.imageUrl ? "Sí" : "No",
      brand: c.brand,
      cleanNameFr: c.cleanNameFr,
      publishReady: p.stockQty > 0 && p.imageUrl ? "Quizás" : "No — falta stock/imagen",
    };
  });

  writeFileSync(
    join(OUT_DIR, "04-existing-products-enrichment.csv"),
    toCsv(
      [
        "productId", "cloverItemId", "nameFr", "currentSiteCategory", "cloverCategory",
        "suggestedSiteCategory", "needsRecategorization", "stockQty", "hasDescription",
        "hasImage", "brand", "cleanNameFr", "publishReady",
      ],
      productRows,
    ),
    "utf8",
  );

  // ── 5. Only uncategorized pending (588 focus file) ──
  const uncategorized = pendingRows.filter((r) => r.cloverCategory === "(sans catégorie)");
  writeFileSync(
    join(OUT_DIR, "05-uncategorized-only.csv"),
    toCsv(
      [
        "cloverItemId", "name", "priceCAD", "recordType", "suggestedCloverCategory",
        "suggestedSiteCategory", "cloverChange", "confidence", "brand", "cleanNameFr", "reason", "action",
      ],
      uncategorized,
    ),
    "utf8",
  );

  // ── 6. Low confidence — manual review queue ──
  const manualReview = pendingRows.filter((r) => r.confidence === "low" || r.recordType === "review");
  writeFileSync(
    join(OUT_DIR, "06-manual-review-queue.csv"),
    toCsv(
      ["cloverItemId", "name", "cloverCategory", "recordType", "suggestedCloverCategory", "suggestedSiteCategory", "reason"],
      manualReview,
    ),
    "utf8",
  );

  // ── 7. README with stats ──
  const stats = {
    pendingTotal: pending.length,
    uncategorized: uncategorized.length,
    highConfidence: pendingRows.filter((r) => r.confidence === "high").length,
    mediumConfidence: pendingRows.filter((r) => r.confidence === "medium").length,
    lowConfidence: pendingRows.filter((r) => r.confidence === "low").length,
    animals: pendingRows.filter((r) => r.recordType === "animal").length,
    products: pendingRows.filter((r) => r.recordType === "product").length,
    ignore: pendingRows.filter((r) => r.recordType === "ignore").length,
    review: pendingRows.filter((r) => r.recordType === "review").length,
    existingProducts: products.length,
    batches: batchRows.length,
  };

  const readme = `# Inventario Reptile Concept — Export de revisión

Generado: ${new Date().toISOString()}

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Pendientes total | ${stats.pendingTotal} |
| Sin categoría Clover | ${stats.uncategorized} |
| Sugerencia alta confianza | ${stats.highConfidence} |
| Sugerencia media confianza | ${stats.mediumConfidence} |
| Revisión manual (baja) | ${stats.lowConfidence} |
| → Animales | ${stats.animals} |
| → Productos | ${stats.products} |
| → Ignorar | ${stats.ignore} |
| → Revisar | ${stats.review} |
| Productos ya creados | ${stats.existingProducts} |
| Lotes sugeridos | ${stats.batches} |

## Archivos

| Archivo | Para qué |
|---------|----------|
| \`01-pending-with-suggestions.csv\` | Todos los pendientes con sugerencias |
| \`02-batch-triage-summary.csv\` | **Empezar aquí** — lotes para acción masiva |
| \`03-clover-to-site-mapping.csv\` | Mapeo Clover ↔ sitio (cambios mínimos) |
| \`04-existing-products-enrichment.csv\` | 596 productos creados — qué falta enriquecer |
| \`05-uncategorized-only.csv\` | Solo los 588 sin categoría Clover |
| \`06-manual-review-queue.csv\` | Items que necesitan ojo humano |

## Estrategia recomendada (mínimo cambio en Clover)

1. **NO crear categorías nuevas en Clover** — usar las 15 existentes.
2. **Solo re-categorizar en Clover** los 588 items sin categoría (asignarles una existente).
3. **Mapeo 1:1** de categorías merchandise Clover → categoría sitio (ver 03).
4. **Animales** quedan en Clover como están; en el sitio van a \`/animals\`, no a boutique.
5. **Opcional en Clover**: mover feeders (ASF, grillons sueltos) de "Rongeur" → "Insecte Vivant" si quieren consistencia.

## Columnas clave

- \`cloverChange\`: qué hacer en Clover POS (idealmente solo "Asignar X" para sin categoría)
- \`suggestedSiteCategory\`: categoría en nuestro sitio
- \`recordType\`: animal | product | ignore | review
- \`confidence\`: high = aplicar en lote con confianza
`;

  writeFileSync(join(OUT_DIR, "README.md"), readme, "utf8");

  console.log("Export complete:", OUT_DIR);
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
