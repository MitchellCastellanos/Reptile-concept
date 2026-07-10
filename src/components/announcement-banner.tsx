import { getLocale } from "next-intl/server";
import { getActiveAnnouncement } from "@/lib/queries";

export async function AnnouncementBanner() {
  const announcement = await getActiveAnnouncement();
  if (!announcement) return null;

  const locale = await getLocale();
  const message = locale === "en" ? announcement.messageEn : announcement.messageFr;

  return (
    <div className="bg-amber-100 px-6 py-2 text-center text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
      {message}
    </div>
  );
}
