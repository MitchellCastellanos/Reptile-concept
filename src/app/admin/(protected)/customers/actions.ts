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

// Handles quoted cells (so addresses/company names containing commas don't
// get split apart) and "" escaped quotes, the way Excel/QuickBooks export CSV.
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findColumnIndex(
  headers: string[],
  opts: { exact?: string[]; includes?: string[]; excludes?: string[] },
): number {
  const { exact = [], includes = [], excludes = [] } = opts;
  const exactIdx = headers.findIndex((h) => exact.includes(h));
  if (exactIdx !== -1) return exactIdx;
  return headers.findIndex(
    (h) => includes.some((k) => h.includes(k)) && !excludes.some((k) => h.includes(k)),
  );
}

// Accepts "1 234,56 $" (fr-CA), "1,234.56", "1234.56", etc.
function parseBalanceCAD(raw: string): number | undefined {
  if (!raw) return undefined;
  let s = raw.replace(/[^0-9,.-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

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

  const header = parseCsvLine(lines[0]).map((h) => stripAccents(h.toLowerCase()));

  const companyIdx = findColumnIndex(header, { includes: ["entreprise", "empresa", "company"] });
  const nameIdx = findColumnIndex(header, {
    exact: ["nom", "name", "nombre"],
    includes: ["nom", "name", "nombre"],
    excludes: ["entreprise", "empresa", "company"],
  });
  const emailIdx = findColumnIndex(header, { includes: ["courriel", "email", "correo", "mail"] });
  const phoneIdx = findColumnIndex(header, { includes: ["telephone", "phone", "tel"] });
  const streetIdx = findColumnIndex(header, { includes: ["adresse", "direccion", "address"] });
  const cityIdx = findColumnIndex(header, { includes: ["ville", "ciudad", "city"] });
  const provinceIdx = findColumnIndex(header, { includes: ["province"] });
  const countryIdx = findColumnIndex(header, { includes: ["pays", "pais", "country"] });
  const postalIdx = findColumnIndex(header, { includes: ["postal", "zip"] });
  const customerTypeIdx = findColumnIndex(header, {
    includes: ["type de client", "tipo de cliente", "customer type", "type"],
  });
  const attachmentsIdx = findColumnIndex(header, {
    includes: ["piece jointe", "pieces jointes", "adjunto", "attachment"],
  });
  const balanceIdx = findColumnIndex(header, { includes: ["solde", "saldo", "balance"] });

  if (emailIdx === -1) {
    return {
      imported: 0,
      skipped: 0,
      error: "Colonne 'courriel' introuvable dans l'en-tête du CSV.",
    };
  }

  let imported = 0;
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const email = (emailIdx >= 0 ? cols[emailIdx] : "")?.toLowerCase();

    if (!email || !email.includes("@")) {
      skipped++;
      continue;
    }

    const fullName = nameIdx >= 0 ? cols[nameIdx] : "";
    const companyName = companyIdx >= 0 ? cols[companyIdx] : "";
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : "";
    const street = streetIdx >= 0 ? cols[streetIdx] : "";
    const city = cityIdx >= 0 ? cols[cityIdx] : "";
    const province = provinceIdx >= 0 ? cols[provinceIdx] : "";
    const country = countryIdx >= 0 ? cols[countryIdx] : "";
    const postalCode = postalIdx >= 0 ? cols[postalIdx] : "";
    const customerType = customerTypeIdx >= 0 ? cols[customerTypeIdx] : "";
    const attachmentsNote = attachmentsIdx >= 0 ? cols[attachmentsIdx] : "";
    const currentBalanceCAD = balanceIdx >= 0 ? parseBalanceCAD(cols[balanceIdx]) : undefined;

    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        fullName: fullName || undefined,
        companyName: companyName || undefined,
        phone: phone || undefined,
        customerType: customerType || undefined,
        attachmentsNote: attachmentsNote || undefined,
        currentBalanceCAD,
      },
      create: {
        email,
        fullName: fullName || companyName || email,
        companyName: companyName || null,
        phone: phone || null,
        customerType: customerType || null,
        attachmentsNote: attachmentsNote || null,
        currentBalanceCAD: currentBalanceCAD ?? 0,
        ageVerified: true,
      },
    });

    if (street || city || province || country || postalCode) {
      const existingAddress = await prisma.address.findFirst({
        where: { customerId: customer.id },
      });
      const addressData = {
        street: street || existingAddress?.street || "",
        city: city || existingAddress?.city || "",
        province: province || existingAddress?.province || "",
        postalCode: postalCode || existingAddress?.postalCode || "",
        country: country || existingAddress?.country || "CA",
      };
      if (existingAddress) {
        await prisma.address.update({ where: { id: existingAddress.id }, data: addressData });
      } else {
        await prisma.address.create({ data: { ...addressData, customerId: customer.id } });
      }
    }

    imported++;
  }

  await recordAudit(admin.id, "Customer", "csv-import", "create");
  revalidatePath("/admin/customers");
  return { imported, skipped };
}
