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
