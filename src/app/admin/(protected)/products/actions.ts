"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notifyStockSubscribers } from "@/lib/stock-notifications";
import type { ProductCategoryValue } from "@/lib/product-categories";

function readProductForm(formData: FormData) {
  return {
    sku: String(formData.get("sku")),
    category: String(formData.get("category")) as ProductCategoryValue,
    nameFr: String(formData.get("nameFr")),
    nameEn: String(formData.get("nameEn")),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    priceCAD: Number(formData.get("priceCAD")),
    stockQty: Number(formData.get("stockQty")),
    published: formData.get("published") === "on",
    requiresColdChain: formData.get("requiresColdChain") === "on",
    cloverItemId: String(formData.get("cloverItemId") ?? "").trim() || null,
  };
}

/** Extra gallery photos beyond the primary imageUrl — fully replaced on every save. */
async function saveProductGallery(productId: string, formData: FormData) {
  let urls: string[] = [];
  try {
    urls = JSON.parse(String(formData.get("extraPhotoUrls") ?? "[]"));
  } catch {
    urls = [];
  }

  await prisma.media.deleteMany({ where: { productId } });
  if (urls.length > 0) {
    await prisma.media.createMany({
      data: urls.map((url, i) => ({ productId, type: "photo" as const, url, sortOrder: i })),
    });
  }
}

export async function createProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readProductForm(formData);
  const product = await prisma.product.create({ data });
  await saveProductGallery(product.id, formData);
  await recordAudit(admin.id, "Product", product.id, "create");

  if (data.cloverItemId) {
    // Resolves the /admin/clover-import queue entry this product was
    // created from, if any — a no-op if the Clover Item ID was typed in by
    // hand instead of coming from that queue.
    await prisma.cloverImportCandidate.updateMany({
      where: { cloverItemId: data.cloverItemId, status: "pending" },
      data: { status: "created" },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/clover-import");
  redirect("/admin/products");
}

export async function updateProductAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
  const data = readProductForm(formData);
  const restocked = existing.stockQty <= 0 && data.stockQty > 0;

  await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(restocked ? { stockRestockedAt: new Date() } : {}),
      ...(data.stockQty <= 0 ? { stockRestockedAt: null } : {}),
    },
  });
  await saveProductGallery(id, formData);
  await recordAudit(admin.id, "Product", id, "update");

  if (restocked) {
    notifyStockSubscribers(id).catch((err) =>
      console.error("[admin] failed to notify stock subscribers:", err),
    );
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductPhotoAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const imageUrl = String(formData.get("photoUrl") ?? "").trim() || null;
  await prisma.product.update({ where: { id }, data: { imageUrl } });
  await recordAudit(admin.id, "Product", id, "update");

  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.product.delete({ where: { id } });
  await recordAudit(admin.id, "Product", id, "delete");

  revalidatePath("/admin/products");
}
