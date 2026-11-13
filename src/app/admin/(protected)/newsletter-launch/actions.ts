"use server";

import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sendLaunchNewsletter, sendLaunchNewsletterTest } from "@/lib/newsletter";

export async function sendLaunchTestAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  if (!to.includes("@")) redirect("/admin/newsletter-launch?error=email");

  const ok = await sendLaunchNewsletterTest(to);
  redirect(`/admin/newsletter-launch?${ok ? "test=ok" : "error=send"}`);
}

export async function sendLaunchAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  // Typed confirmation: a mass send can't be undone.
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "ENVOYER") {
    redirect("/admin/newsletter-launch?error=confirm");
  }

  let params: string;
  try {
    const result = await sendLaunchNewsletter(admin.id);
    await recordAudit(admin.id, "NewsletterLaunch", "launch", "create");
    params = `sent=${result.sent}&failed=${result.failed}`;
  } catch {
    params = "error=already";
  }
  redirect(`/admin/newsletter-launch?${params}`);
}
