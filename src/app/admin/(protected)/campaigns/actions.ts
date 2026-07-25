"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

function readCampaignForm(formData: FormData) {
  return {
    subjectFr: String(formData.get("subjectFr") ?? "").trim(),
    subjectEn: String(formData.get("subjectEn") ?? "").trim(),
    bodyFr: String(formData.get("bodyFr") ?? "").trim(),
    bodyEn: String(formData.get("bodyEn") ?? "").trim(),
  };
}

function toHtml(body: string) {
  return body
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");
}

async function dispatchCampaign(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  const recipients = await prisma.customer.findMany({
    where: { emailOptOut: false },
    select: { email: true, preferredLang: true },
  });

  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient.email,
        subject: recipient.preferredLang === "en" ? campaign.subjectEn : campaign.subjectFr,
        html: toHtml(recipient.preferredLang === "en" ? campaign.bodyEn : campaign.bodyFr),
      }),
    ),
  );

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "sent", sentAt: new Date(), recipientCount: recipients.length },
  });
}

export async function saveDraftAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readCampaignForm(formData);
  const campaign = await prisma.emailCampaign.create({
    data: { ...data, createdByAdminId: admin.id },
  });
  await recordAudit(admin.id, "EmailCampaign", campaign.id, "create");

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function updateDraftAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readCampaignForm(formData);
  await prisma.emailCampaign.update({ where: { id }, data });
  await recordAudit(admin.id, "EmailCampaign", id, "update");

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function sendNewCampaignAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readCampaignForm(formData);
  const campaign = await prisma.emailCampaign.create({
    data: { ...data, createdByAdminId: admin.id },
  });
  await dispatchCampaign(campaign.id);
  await recordAudit(admin.id, "EmailCampaign", campaign.id, "create");

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function sendExistingCampaignAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await dispatchCampaign(id);
  await recordAudit(admin.id, "EmailCampaign", id, "update");

  revalidatePath("/admin/campaigns");
}

export async function resendCampaignAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const original = await prisma.emailCampaign.findUniqueOrThrow({ where: { id } });
  const copy = await prisma.emailCampaign.create({
    data: {
      subjectFr: original.subjectFr,
      subjectEn: original.subjectEn,
      bodyFr: original.bodyFr,
      bodyEn: original.bodyEn,
      createdByAdminId: admin.id,
    },
  });
  await dispatchCampaign(copy.id);
  await recordAudit(admin.id, "EmailCampaign", copy.id, "create");

  revalidatePath("/admin/campaigns");
}

export async function deleteCampaignAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  await prisma.emailCampaign.delete({ where: { id } });
  await recordAudit(admin.id, "EmailCampaign", id, "delete");

  revalidatePath("/admin/campaigns");
}
