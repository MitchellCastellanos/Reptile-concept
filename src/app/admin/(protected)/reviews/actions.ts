"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function togglePublishReviewAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const published = formData.get("published") === "true";
  await prisma.review.update({ where: { id }, data: { published: !published } });
  await recordAudit(admin.id, "Review", id, "update");

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function deleteReviewAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.review.delete({ where: { id } });
  await recordAudit(admin.id, "Review", id, "delete");

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}
