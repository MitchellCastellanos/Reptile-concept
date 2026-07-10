"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

function readAnimalForm(formData: FormData) {
  return {
    speciesId: String(formData.get("speciesId")),
    morph: String(formData.get("morph")),
    sex: String(formData.get("sex")) as "male" | "female" | "unknown",
    priceCAD: Number(formData.get("priceCAD")),
    status: String(formData.get("status")) as
      | "available"
      | "reserved"
      | "sold"
      | "on_hold"
      | "not_for_sale",
    descriptionFr: String(formData.get("descriptionFr")),
    descriptionEn: String(formData.get("descriptionEn")),
  };
}

export async function createAnimalAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readAnimalForm(formData);
  const animal = await prisma.animal.create({ data });
  await recordAudit(admin.id, "Animal", animal.id, "create");

  revalidatePath("/admin/animals");
  redirect("/admin/animals");
}

export async function updateAnimalAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readAnimalForm(formData);
  await prisma.animal.update({ where: { id }, data });
  await recordAudit(admin.id, "Animal", id, "update");

  revalidatePath("/admin/animals");
  redirect("/admin/animals");
}

export async function deleteAnimalAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.animal.delete({ where: { id } });
  await recordAudit(admin.id, "Animal", id, "delete");

  revalidatePath("/admin/animals");
}
