import { prisma } from "@/lib/db";
import { sendEmail, sendEmailBatch } from "@/lib/email";
import { newsletterConfirmationEmail, launchNewsletterEmail } from "@/lib/email-templates";
import { getStoreContactInfo } from "@/lib/store-info";
import { getSiteUrl } from "@/lib/site-url";
import { WELCOME_PROMO_CODE } from "@/lib/promo";

export async function subscribeToNewsletter(email: string, locale: "fr" | "en") {
  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { unsubscribedAt: null },
    create: { email, locale },
  });

  const unsubscribeUrl = `${getSiteUrl()}/api/newsletter/unsubscribe?id=${subscriber.id}`;
  const storeInfo = await getStoreContactInfo();
  const { subject, html } = newsletterConfirmationEmail(locale, unsubscribeUrl, storeInfo, WELCOME_PROMO_CODE);
  await sendEmail({ to: email, subject, html });
}

// ---- One-off launch announcement -------------------------------------------
// Logged as an EmailCampaign row (subjectFr = LAUNCH_CAMPAIGN_KEY) so it can
// only be sent once to the list, even if the button is clicked twice.
const LAUNCH_CAMPAIGN_KEY = "[newsletter-launch] Lancement de la boutique en ligne";

function launchUrls(locale: "fr" | "en", subscriberId: string) {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  return {
    shopUrl: `${siteUrl}/${locale}`,
    unsubscribeUrl: `${siteUrl}/api/newsletter/unsubscribe?id=${subscriberId}`,
  };
}

export async function getLaunchNewsletterStatus() {
  const [activeSubscribers, sent] = await Promise.all([
    prisma.newsletterSubscriber.groupBy({
      by: ["locale"],
      where: { unsubscribedAt: null },
      _count: true,
    }),
    prisma.emailCampaign.findFirst({
      where: { subjectFr: LAUNCH_CAMPAIGN_KEY, status: "sent" },
    }),
  ]);
  return {
    fr: activeSubscribers.find((g) => g.locale === "fr")?._count ?? 0,
    en: activeSubscribers.find((g) => g.locale === "en")?._count ?? 0,
    alreadySentAt: sent?.sentAt ?? null,
  };
}

// Sends the FR and EN versions to a single address so they can be proofread
// exactly as subscribers will see them (subject prefixed with [TEST]).
export async function sendLaunchNewsletterTest(to: string) {
  const storeInfo = await getStoreContactInfo();
  const results: boolean[] = [];
  for (const locale of ["fr", "en"] as const) {
    const { subject, html } = launchNewsletterEmail(
      locale,
      { ...launchUrls(locale, "test-preview"), promoCode: WELCOME_PROMO_CODE },
      storeInfo,
    );
    results.push(await sendEmail({ to, subject: `[TEST ${locale.toUpperCase()}] ${subject}`, html }));
  }
  return results.every(Boolean);
}

export async function sendLaunchNewsletter(adminId: string) {
  const existing = await prisma.emailCampaign.findFirst({
    where: { subjectFr: LAUNCH_CAMPAIGN_KEY, status: "sent" },
  });
  if (existing) throw new Error("Le lancement a déjà été envoyé / Launch already sent");

  const [subscribers, storeInfo] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { id: true, email: true, locale: true },
    }),
    getStoreContactInfo(),
  ]);

  const emails = subscribers.map((s) => {
    const { subject, html } = launchNewsletterEmail(
      s.locale,
      { ...launchUrls(s.locale, s.id), promoCode: WELCOME_PROMO_CODE },
      storeInfo,
    );
    return { to: s.email, subject, html };
  });

  const result = await sendEmailBatch(emails);

  await prisma.emailCampaign.create({
    data: {
      subjectFr: LAUNCH_CAMPAIGN_KEY,
      subjectEn: "[newsletter-launch] Online shop launch",
      bodyFr: "Annonce de lancement + code BIENVENUE15 (abonnés infolettre)",
      bodyEn: "Launch announcement + BIENVENUE15 code (newsletter subscribers)",
      status: result.sent > 0 ? "sent" : "draft",
      recipientCount: result.sent,
      sentAt: result.sent > 0 ? new Date() : null,
      createdByAdminId: adminId,
    },
  });

  return { ...result, total: subscribers.length };
}
