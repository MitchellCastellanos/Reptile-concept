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
    cloverItemId: String(formData.get("cloverItemId") ?? "").trim() || null,
  };
}

async function savePrimaryPhoto(animalId: string, formData: FormData) {
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const existing = await prisma.media.findFirst({
    where: { animalId },
    orderBy: { sortOrder: "asc" },
  });

  if (photoUrl) {
    if (existing) {
      await prisma.media.update({ where: { id: existing.id }, data: { url: photoUrl } });
    } else {
      await prisma.media.create({
        data: { animalId, type: "photo", url: photoUrl, sortOrder: 0 },
      });
    }
  } else if (existing) {
    await prisma.media.delete({ where: { id: existing.id } });
  }
}

export async function createAnimalAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readAnimalForm(formData);
  const animal = await prisma.animal.create({ data });
  await savePrimaryPhoto(animal.id, formData);
  await recordAudit(admin.id, "Animal", animal.id, "create");

  if (data.cloverItemId) {
    // Resolves the /admin/clover-import queue entry this animal was created
    // from, if any — a no-op if the Clover Item ID was typed in by hand
    // instead of coming from that queue.
    await prisma.cloverImportCandidate.updateMany({
      where: { cloverItemId: data.cloverItemId, status: "pending" },
      data: { status: "created" },
    });
  }

  revalidatePath("/admin/animals");
  revalidatePath("/admin/clover-import");
  redirect("/admin/animals");
}

export async function updateAnimalAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readAnimalForm(formData);
  await prisma.animal.update({ where: { id }, data });
  await savePrimaryPhoto(id, formData);
  await recordAudit(admin.id, "Animal", id, "update");

  revalidatePath("/admin/animals");
  redirect("/admin/animals");
}

// For an Animal record that was actually a Product (e.g. auto-created by the
// Clover import routing bug — "Gecko Food" landing under the "Gecko" live
// -animal category). Frees the Clover Item ID so future Clover syncs stop
// touching this Animal, archives it (not_for_sale, so it drops off public
// listings) instead of deleting it outright, and hands off to the product
// form pre-filled the same way the Clover import queue does — staff still
// has to pick the right product category since Clover doesn't tell us that.
export async function convertAnimalToProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const animal = await prisma.animal.findUnique({ where: { id } });
  if (!animal) redirect("/admin/animals");

  await prisma.animal.update({
    where: { id },
    data: { cloverItemId: null, status: "not_for_sale" },
  });
  await recordAudit(admin.id, "Animal", id, "update");

  revalidatePath("/admin/animals");

  const params = new URLSearchParams({ cloverName: animal.morph, priceCAD: String(animal.priceCAD) });
  if (animal.cloverItemId) params.set("cloverItemId", animal.cloverItemId);
  redirect(`/admin/products/new?${params.toString()}`);
}

export async function deleteAnimalAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.animal.delete({ where: { id } });
  await recordAudit(admin.id, "Animal", id, "delete");

  revalidatePath("/admin/animals");
}
