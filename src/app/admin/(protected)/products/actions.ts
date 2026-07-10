"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

function readProductForm(formData: FormData) {
  return {
    sku: String(formData.get("sku")),
    category: String(formData.get("category")) as
      | "terrarium"
      | "substrate"
      | "decor"
      | "food_live"
      | "food_frozen"
      | "food_packaged",
    nameFr: String(formData.get("nameFr")),
    nameEn: String(formData.get("nameEn")),
    priceCAD: Number(formData.get("priceCAD")),
    stockQty: Number(formData.get("stockQty")),
    requiresColdChain: formData.get("requiresColdChain") === "on",
  };
}

export async function createProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const product = await prisma.product.create({ data: readProductForm(formData) });
  await recordAudit(admin.id, "Product", product.id, "create");

  revalidatePath("/admin/products");
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
