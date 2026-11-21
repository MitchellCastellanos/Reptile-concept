export const REVIEW_NAME_DISPLAYS = ["full", "first_initial", "anonymous"] as const;
export type ReviewNameDisplay = (typeof REVIEW_NAME_DISPLAYS)[number];

export function parseReviewNameDisplay(value: unknown): ReviewNameDisplay {
  return REVIEW_NAME_DISPLAYS.find((mode) => mode === value) ?? "first_initial";
}

/**
 * Name shown next to a public review, according to the reviewer's choice:
 * full name, first name + initial of the last name ("Marie T."), or anonymous.
 */
export function formatReviewerName(
  fullName: string,
  mode: ReviewNameDisplay,
  locale: "fr" | "en",
): string {
  if (mode === "anonymous") return locale === "en" ? "Anonymous customer" : "Client anonyme";

  const name = fullName.trim().replace(/\s+/g, " ");
  if (!name) return locale === "en" ? "Anonymous customer" : "Client anonyme";
  if (mode === "full") return name;

  const parts = name.split(" ");
  if (parts.length === 1) return name;
  const initial = Array.from(parts[parts.length - 1])[0]?.toLocaleUpperCase() ?? "";
  return `${parts[0]} ${initial}.`;
}
