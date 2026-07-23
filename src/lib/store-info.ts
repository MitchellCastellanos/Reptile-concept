// Plain-text store info for transactional emails (no next-intl context available
// once these run from background/cron code). Keep in sync with messages/*.json Footer.
export const STORE_INFO = {
  fr: {
    name: "Reptile Concept",
    address: "Lachine, QC — sur rendez-vous",
    hours: "Lun–Sam 10h–18h",
    phone: "(514) 555-0199",
  },
  en: {
    name: "Reptile Concept",
    address: "Lachine, QC — by appointment",
    hours: "Mon–Sat 10am–6pm",
    phone: "(514) 555-0199",
  },
} as const;

export const CONTACT_EMAIL = "contact@reptileconcept.ca";
