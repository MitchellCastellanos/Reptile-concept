"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const HOURS_FIELDS = [
  "hoursMon",
  "hoursTue",
  "hoursWed",
  "hoursThu",
  "hoursFri",
  "hoursSat",
  "hoursSun",
] as const;

export async function updateStoreSettingsAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data: Record<string, string> = {
    phone: String(formData.get("phone") ?? ""),
    addressFr: String(formData.get("addressFr") ?? ""),
    addressEn: String(formData.get("addressEn") ?? ""),
  };
  for (const field of HOURS_FIELDS) {
    data[field] = String(formData.get(field) ?? "");
  }

  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  await recordAudit(admin.id, "StoreSettings", "1", "update");

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  redirect("/admin/settings");
}
