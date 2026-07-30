"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { isCloverConfigured } from "@/lib/clover";
import { importFullCloverCatalog } from "@/lib/clover-sync";

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
