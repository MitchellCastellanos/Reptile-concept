"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
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
    requiresColdChain: formData.get("requiresColdChain") === "on",
    cloverItemId: String(formData.get("cloverItemId") ?? "").trim() || null,
  };
}

export async function createProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readProductForm(formData);
  const product = await prisma.product.create({ data });
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

  await prisma.product.update({ where: { id }, data: readProductForm(formData) });
  await recordAudit(admin.id, "Product", id, "update");

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.product.delete({ where: { id } });
  await recordAudit(admin.id, "Product", id, "delete");

  revalidatePath("/admin/products");
}
