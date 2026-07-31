"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { isCloverConfigured } from "@/lib/clover";
import {
  importFullCloverCatalog,
  bulkIgnoreCandidatesByCategory,
  bulkCreateProductsFromCategory,
} from "@/lib/clover-sync";

// The category filter forms use "__none__" as a stand-in for "no Clover
// category" (a real null can't travel through a form field).
function decodeCloverCategory(formData: FormData): string | null {
  const raw = String(formData.get("cloverCategoryName") ?? "");
  return raw === "__none__" ? null : raw;
}

export async function ignoreCloverImportCandidateAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.cloverImportCandidate.update({ where: { id }, data: { status: "ignored" } });
  await recordAudit(admin.id, "CloverImportCandidate", id, "update");

  revalidatePath("/admin/clover-import");
}

export type FullImportActionResult = {
  error?: string;
  totalItems?: number;
  queued?: number;
  alreadyLinked?: number;
};

// One-time (repeatable) backfill of Clover's existing catalog — the
// webhook/poll only ever pick up items created or edited after the
// integration went live, so a merchant's pre-existing inventory needs this
// to show up here at all.
export async function importFullCatalogAction(
  _prevState: FullImportActionResult | undefined,
): Promise<FullImportActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  if (!isCloverConfigured()) {
    return { error: "Identifiants Clover non configurés (CLOVER_MERCHANT_ID / CLOVER_API_TOKEN)." };
  }

  try {
    const result = await importFullCloverCatalog();
    await recordAudit(admin.id, "CloverImportCandidate", "full-import", "create");
    revalidatePath("/admin/clover-import");
    revalidatePath("/admin/animals");
    revalidatePath("/admin/products");
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur d'import depuis Clover." };
  }
}

export type BulkIgnoreActionResult = { error?: string; ignored?: number };

export async function bulkIgnoreCategoryAction(
  _prevState: BulkIgnoreActionResult | undefined,
  formData: FormData,
): Promise<BulkIgnoreActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const cloverCategoryName = decodeCloverCategory(formData);
  const { ignored } = await bulkIgnoreCandidatesByCategory(cloverCategoryName);
  await recordAudit(admin.id, "CloverImportCandidate", "bulk-ignore", "update");

  revalidatePath("/admin/clover-import");
  return { ignored };
}

export type BulkCreateActionResult = { error?: string; created?: number; skipped?: number };

const PRODUCT_CATEGORY_VALUES = [
  "terrarium",
  "substrate",
  "decor",
  "food_live",
  "food_frozen",
  "food_packaged",
] as const;

export async function bulkCreateProductsCategoryAction(
  _prevState: BulkCreateActionResult | undefined,
  formData: FormData,
): Promise<BulkCreateActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const cloverCategoryName = decodeCloverCategory(formData);
  const productCategory = String(formData.get("productCategory") ?? "");
  if (!PRODUCT_CATEGORY_VALUES.includes(productCategory as (typeof PRODUCT_CATEGORY_VALUES)[number])) {
    return { error: "Choisissez une catégorie de produit." };
  }

  const { created, skipped } = await bulkCreateProductsFromCategory(
    cloverCategoryName,
    productCategory as (typeof PRODUCT_CATEGORY_VALUES)[number],
  );
  await recordAudit(admin.id, "Product", "bulk-create-from-clover", "create");

  revalidatePath("/admin/clover-import");
  revalidatePath("/admin/products");
  revalidatePath("/boutique");
  return { created, skipped };
}
