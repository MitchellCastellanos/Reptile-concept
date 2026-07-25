// Public-facing store info (address, hours, phone, contact email) shown to
// customers in the footer, receipts, and transactional emails. Sourced from
// admin-editable StoreSettings rather than hardcoded, since this is real
// business info the client needs to be able to correct without a code change.
import { getStoreSettings } from "@/lib/settings";

export type StoreContactInfo = {
  fr: { name: string; address: string; hours: string; phone: string };
  en: { name: string; address: string; hours: string; phone: string };
  contactEmail: string;
};

export async function getStoreContactInfo(): Promise<StoreContactInfo> {
  const settings = await getStoreSettings();
  return {
    fr: { name: "Reptile Concept", address: settings.addressFr, hours: settings.hoursFr, phone: settings.contactPhone },
    en: { name: "Reptile Concept", address: settings.addressEn, hours: settings.hoursEn, phone: settings.contactPhone },
    contactEmail: settings.contactEmail,
  };
}
