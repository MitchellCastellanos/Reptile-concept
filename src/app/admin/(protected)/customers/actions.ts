"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function updateCustomerNotesAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const internalNotes = String(formData.get("internalNotes") ?? "");
  await prisma.customer.update({ where: { id }, data: { internalNotes } });
  await recordAudit(admin.id, "Customer", id, "update");

  revalidatePath(`/admin/customers/${id}`);
}

export async function createCustomerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const preferredLang = String(formData.get("preferredLang") ?? "fr") as "fr" | "en";

  if (!fullName || !email) {
    return { error: "Nom et courriel requis." };
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un client existe déjà avec ce courriel." };
  }

  const customer = await prisma.customer.create({
    data: { fullName, email, phone: phone || null, preferredLang, ageVerified: true },
  });
  await recordAudit(admin.id, "Customer", customer.id, "create");

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

type CsvImportResult = { imported: number; skipped: number; error?: string };

export async function importCustomersCsvAction(
  _prevState: CsvImportResult | undefined,
  formData: FormData,
): Promise<CsvImportResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const file = formData.get("csvFile");
  if (!(file instanceof File) || file.size === 0) {
    return { imported: 0, skipped: 0, error: "Choisissez un fichier CSV." };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { imported: 0, skipped: 0, error: "Fichier vide." };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.findIndex((h) => h.includes("name"));
  const emailIdx = header.findIndex((h) => h.includes("email") || h.includes("courriel"));
  const phoneIdx = header.findIndex((h) => h.includes("phone") || h.includes("tel"));

  if (emailIdx === -1) {
    return {
      imported: 0,
      skipped: 0,
      error: "Colonne 'email' introuvable dans l'en-tête du CSV.",
    };
  }

  let imported = 0;
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const email = cols[emailIdx]?.toLowerCase();
    const fullName = nameIdx >= 0 ? cols[nameIdx] : "";
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : "";

    if (!email || !email.includes("@")) {
      skipped++;
      continue;
    }

    await prisma.customer.upsert({
      where: { email },
      update: { fullName: fullName || undefined, phone: phone || undefined },
      create: {
        email,
        fullName: fullName || email,
        phone: phone || null,
        ageVerified: true,
      },
    });
    imported++;
  }

  await recordAudit(admin.id, "Customer", "csv-import", "create");
  revalidatePath("/admin/customers");
  return { imported, skipped };
}
