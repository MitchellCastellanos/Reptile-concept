"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
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

// Turns an uploaded file into rows of cell text, regardless of whether it's
// actually a real CSV, an .xlsx workbook, or a legacy binary .xls workbook
// wearing a .csv extension — a common export trap from QuickBooks/Excel on
// Quebec locales, where "Enregistrer sous > CSV" can silently keep the
// old .xls (OLE2/BIFF) format. That binary format isn't readable as text or
// by exceljs, so it's reported as a clear error instead of silently
// producing garbage headers.
async function extractRows(file: File): Promise<string[][] | { error: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const isLegacyXls =
    buffer.length >= 4 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;
  if (isLegacyXls) {
    return {
      error:
        "Ce fichier est en fait un ancien format Excel (.xls) enregistré avec une extension " +
        ".csv. Ouvrez-le dans Excel, faites « Enregistrer sous » et choisissez « Classeur Excel " +
        "(.xlsx) » ou « CSV UTF-8 », puis réessayez l'import.",
    };
  }

  const isXlsx = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (isXlsx) {
    const workbook = new ExcelJS.Workbook();
    // exceljs's own type declarations merge a conflicting global `Buffer`
    // interface (extends ArrayBuffer) on top of @types/node's, making the
    // `load(buffer: Buffer)` signature untypeable at the call site — cast
    // to a locally-defined signature to bypass that broken declaration,
    // not a real mismatch.
    const xlsxReader = workbook.xlsx as unknown as { load: (buf: Buffer) => Promise<unknown> };
    await xlsxReader.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return { error: "Le classeur Excel ne contient aucune feuille." };
    const rows: string[][] = [];
    worksheet.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push((cell.text ?? "").toString().trim());
      });
      rows.push(cells);
    });
    return rows;
  }

  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
}

export async function importCustomersCsvAction(
  _prevState: CsvImportResult | undefined,
  formData: FormData,
): Promise<CsvImportResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const file = formData.get("csvFile");
  if (!(file instanceof File) || file.size === 0) {
    return { imported: 0, skipped: 0, error: "Choisissez un fichier CSV ou Excel." };
  }

  const rows = await extractRows(file);
  if ("error" in rows) {
    return { imported: 0, skipped: 0, error: rows.error };
  }
  if (rows.length === 0) {
    return { imported: 0, skipped: 0, error: "Fichier vide." };
  }

  const header = rows[0].map((h) => stripAccents(h.toLowerCase()));

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

  for (const cols of rows.slice(1)) {
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
