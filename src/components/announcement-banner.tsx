import { getLocale } from "next-intl/server";
import { getActiveAnnouncement } from "@/lib/queries";

export async function AnnouncementBanner() {
  const announcement = await getActiveAnnouncement();
  if (!announcement) return null;

  const locale = await getLocale();
  const message = locale === "en" ? announcement.messageEn : announcement.messageFr;

  return (
    <div className="bg-accent px-6 py-2.5 text-center text-sm font-medium text-white">
      {message}
    </div>
  );
}
