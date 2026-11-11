import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { newsletterConfirmationEmail } from "@/lib/email-templates";
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
