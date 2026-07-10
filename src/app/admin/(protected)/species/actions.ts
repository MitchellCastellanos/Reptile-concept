"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

function optional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function readSpeciesForm(formData: FormData) {
  return {
    commonNameFr: String(formData.get("commonNameFr")),
    commonNameEn: String(formData.get("commonNameEn")),
    scientificName: String(formData.get("scientificName")),
    careSheetUrl: optional(formData, "careSheetUrl"),
    experienceLevel: optional(formData, "experienceLevel") as
      | "beginner"
      | "intermediate"
      | "advanced"
      | null,
    descriptionFr: optional(formData, "descriptionFr"),
    descriptionEn: optional(formData, "descriptionEn"),
    adultSizeFr: optional(formData, "adultSizeFr"),
    adultSizeEn: optional(formData, "adultSizeEn"),
    lifespanFr: optional(formData, "lifespanFr"),
    lifespanEn: optional(formData, "lifespanEn"),
    temperamentFr: optional(formData, "temperamentFr"),
    temperamentEn: optional(formData, "temperamentEn"),
    dietFr: optional(formData, "dietFr"),
    dietEn: optional(formData, "dietEn"),
    humidity: optional(formData, "humidity"),
    tempDay: optional(formData, "tempDay"),
    tempNight: optional(formData, "tempNight"),
    uvbNeeds: optional(formData, "uvbNeeds"),
    enclosureMinSize: optional(formData, "enclosureMinSize"),
    substrate: optional(formData, "substrate"),
    feedingFrequency: optional(formData, "feedingFrequency"),
    handlingFr: optional(formData, "handlingFr"),
    handlingEn: optional(formData, "handlingEn"),
  };
}

export async function createSpeciesAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readSpeciesForm(formData);
  const species = await prisma.species.create({ data });
  await recordAudit(admin.id, "Species", species.id, "create");

  revalidatePath("/admin/species");
  redirect("/admin/species");
}

export async function updateSpeciesAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readSpeciesForm(formData);
  await prisma.species.update({ where: { id }, data });
  await recordAudit(admin.id, "Species", id, "update");

  revalidatePath("/admin/species");
  redirect("/admin/species");
}

export async function deleteSpeciesAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.species.delete({ where: { id } });
  await recordAudit(admin.id, "Species", id, "delete");

  revalidatePath("/admin/species");
}
