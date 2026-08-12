/**
 * Match Zoo Med products to local JPEG pack, upload to Vercel Blob, set imageUrl.
 *
 *   npm run inventory:zoomed-images              # dry-run + CSV
 *   npm run inventory:zoomed-images -- --apply   # upload + DB update
 *   npm run inventory:zoomed-images -- --apply --force  # overwrite existing images
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SITE_TO_CLOVER: Record<string, string> = {
  lighting: "Lumiere",
  decor: "Decoration",
  supplement: "Supplement",
  food_packaged: "Nourriture",
  food_live: "Insecte Vivant",
  food_frozen: "Nourriture",
  terrarium: "Habitat",
  substrate: "Substrat",
  equipment: "Piece Remplacement/ Electronique",
};

function loadCloverCategories(): Map<string, string> {
  const map = new Map<string, string>();
  const csvPath = join(process.cwd(), "exports/clover-import-update.csv");
  if (!existsSync(csvPath)) return map;
  for (const line of readFileSync(csvPath, "utf-8").split("\n").slice(1)) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    const cloverItemId = parts[0]?.trim();
    const cloverCategory = parts[parts.length - 1]?.trim();
    if (cloverItemId && cloverCategory) map.set(cloverItemId, cloverCategory);
  }
  return map;
}
import { put } from "@vercel/blob";
import {
  getIndexedImages,
  isSkippableGeneric,
  isStrictZoomedProductName,
  matchZoomedProductImage,
} from "./zoomed-image-matcher";

const OUT_DIR = join(process.cwd(), "exports");
const CSV_PATH = join(OUT_DIR, "zoomed-image-matches.csv");

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

async function uploadImage(localPath: string, key: string): Promise<string> {
  const blobConfigured =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    (Boolean(process.env.BLOB_STORE_ID) && Boolean(process.env.VERCEL_OIDC_TOKEN));

  if (!blobConfigured) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  const body = readFileSync(localPath);
  const blob = await put(`products/${key}.jpg`, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/jpeg",
  });
  return blob.url;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const force = process.argv.includes("--force");
  const minTier = process.argv.includes("--high-only") ? "high" : "low";

  console.log(apply ? "=== APPLY ZOOMED IMAGES ===" : "=== DRY RUN ZOOMED IMAGES ===");
  console.log(`Image pack: ${getIndexedImages().length} JPGs indexed`);

  const cloverCategories = loadCloverCategories();
  const { prisma } = await import("../src/lib/db");
  const products = await prisma.product.findMany({
    select: {
      id: true,
      cloverItemId: true,
      nameFr: true,
      imageUrl: true,
      published: true,
      category: true,
    },
    orderBy: { nameFr: "asc" },
  });

  const zoomed = products.filter((p) => isStrictZoomedProductName(p.nameFr));
  console.log(`Zoomed products in DB: ${zoomed.length}`);

  type Row = {
    productId: string;
    cloverItemId: string;
    nameFr: string;
    hadImage: boolean;
    tier: string;
    method: string;
    imageFile: string;
    imagePath: string;
    action: string;
    imageUrl: string;
  };

  const rows: Row[] = [];
  let uploaded = 0;
  let skippedExisting = 0;
  let skippedGeneric = 0;
  let noMatch = 0;
  let failed = 0;

  const tierRank = { high: 3, medium: 2, low: 1, none: 0 } as const;

  for (const product of zoomed) {
    if (isSkippableGeneric(product.nameFr)) {
      skippedGeneric++;
      rows.push({
        productId: product.id,
        cloverItemId: product.cloverItemId ?? "",
        nameFr: product.nameFr,
        hadImage: Boolean(product.imageUrl),
        tier: "none",
        method: "generic-skip",
        imageFile: "",
        imagePath: "",
        action: "skip_generic",
        imageUrl: product.imageUrl ?? "",
      });
      continue;
    }

    if (product.imageUrl && !force) {
      skippedExisting++;
      rows.push({
        productId: product.id,
        cloverItemId: product.cloverItemId ?? "",
        nameFr: product.nameFr,
        hadImage: true,
        tier: "none",
        method: "existing-image",
        imageFile: "",
        imagePath: "",
        action: "skip_existing",
        imageUrl: product.imageUrl,
      });
      continue;
    }

    const cloverCategory =
      (product.cloverItemId ? cloverCategories.get(product.cloverItemId) : undefined) ??
      SITE_TO_CLOVER[product.category] ??
      product.category;

    const match = matchZoomedProductImage(product.nameFr, { cloverCategory });
    if (!match || tierRank[match.tier] < tierRank[minTier as keyof typeof tierRank]) {
      noMatch++;
      rows.push({
        productId: product.id,
        cloverItemId: product.cloverItemId ?? "",
        nameFr: product.nameFr,
        hadImage: Boolean(product.imageUrl),
        tier: match?.tier ?? "none",
        method: match?.method ?? "no-match",
        imageFile: match?.fileName ?? "",
        imagePath: match?.relativePath ?? "",
        action: "no_match",
        imageUrl: product.imageUrl ?? "",
      });
      continue;
    }

    const blobKey = product.cloverItemId || product.id;
    let imageUrl = product.imageUrl ?? "";

    if (apply) {
      try {
        imageUrl = await uploadImage(match.absolutePath, blobKey);
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl },
        });
        uploaded++;
      } catch (err) {
        failed++;
        rows.push({
          productId: product.id,
          cloverItemId: product.cloverItemId ?? "",
          nameFr: product.nameFr,
          hadImage: Boolean(product.imageUrl),
          tier: match.tier,
          method: match.method,
          imageFile: match.fileName,
          imagePath: match.relativePath,
          action: `error:${err instanceof Error ? err.message : String(err)}`,
          imageUrl: product.imageUrl ?? "",
        });
        continue;
      }
    }

    rows.push({
      productId: product.id,
      cloverItemId: product.cloverItemId ?? "",
      nameFr: product.nameFr,
      hadImage: Boolean(product.imageUrl),
      tier: match.tier,
      method: match.method,
      imageFile: match.fileName,
      imagePath: match.relativePath,
      action: apply ? "uploaded" : "would_upload",
      imageUrl: apply ? imageUrl : "",
    });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const header = [
    "productId",
    "cloverItemId",
    "nameFr",
    "hadImage",
    "tier",
    "method",
    "imageFile",
    "imagePath",
    "action",
    "imageUrl",
  ];
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => csvEscape(String(r[h as keyof Row] ?? ""))).join(","))].join("\n");
  writeFileSync(CSV_PATH, csv, "utf-8");

  const matched = rows.filter((r) => r.action === "uploaded" || r.action === "would_upload");
  const withPhotoAfter = zoomed.filter((p) => {
    const row = rows.find((r) => r.productId === p.id);
    return Boolean(row?.imageUrl || (row?.action === "would_upload" && !apply));
  });

  console.log({
    zoomedProducts: zoomed.length,
    matched: matched.length,
    uploaded: apply ? uploaded : 0,
    wouldUpload: apply ? 0 : matched.length,
    skippedExisting,
    skippedGeneric,
    noMatch,
    failed,
    coverageAfter: apply
      ? `${uploaded + skippedExisting} / ${zoomed.length} (${(((uploaded + skippedExisting) / zoomed.length) * 100).toFixed(1)}%)`
      : `${matched.length + skippedExisting} / ${zoomed.length} (${(((matched.length + skippedExisting) / zoomed.length) * 100).toFixed(1)}%) projected`,
    csv: CSV_PATH,
  });

  if (!apply) {
    console.log("\nRe-run with --apply to upload matched images and update imageUrl.");
    console.log("Use --high-only to skip low-confidence fuzzy matches.");
    console.log("Use --force to overwrite products that already have an image.");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
