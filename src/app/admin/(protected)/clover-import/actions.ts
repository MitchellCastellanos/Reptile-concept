"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function ignoreCloverImportCandidateAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.cloverImportCandidate.update({ where: { id }, data: { status: "ignored" } });
  await recordAudit(admin.id, "CloverImportCandidate", id, "update");

  revalidatePath("/admin/clover-import");
}
