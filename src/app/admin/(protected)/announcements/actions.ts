"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function createAnnouncementAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const messageFr = String(formData.get("messageFr"));
  const messageEn = String(formData.get("messageEn"));
  const endsAtRaw = String(formData.get("endsAt") ?? "");

  const announcement = await prisma.announcement.create({
    data: {
      messageFr,
      messageEn,
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      active: true,
      createdByAdminId: admin.id,
    },
  });
  await recordAudit(admin.id, "Announcement", announcement.id, "create");

  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}

export async function toggleAnnouncementAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  await prisma.announcement.update({ where: { id }, data: { active: !active } });
  await recordAudit(admin.id, "Announcement", id, "update");

  revalidatePath("/admin/announcements");
}
