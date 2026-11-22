import { describe, expect, it } from "vitest";
import { formatReviewerName, parseReviewNameDisplay } from "./review-display";

describe("formatReviewerName", () => {
  it("shows the full name", () => {
    expect(formatReviewerName("Marie Tremblay", "full", "fr")).toBe("Marie Tremblay");
  });
  it("shows first name + last initial", () => {
    expect(formatReviewerName("Marie Tremblay", "first_initial", "fr")).toBe("Marie T.");
    expect(formatReviewerName("  jean   de la cruz ", "first_initial", "fr")).toBe("jean C.");
    expect(formatReviewerName("Émilie Élie", "first_initial", "fr")).toBe("Émilie É.");
  });
  it("keeps single names as-is", () => {
    expect(formatReviewerName("Cher", "first_initial", "en")).toBe("Cher");
  });
  it("is localized when anonymous", () => {
    expect(formatReviewerName("Marie Tremblay", "anonymous", "fr")).toBe("Client anonyme");
    expect(formatReviewerName("Marie Tremblay", "anonymous", "en")).toBe("Anonymous customer");
  });
  it("falls back to anonymous for an empty name", () => {
    expect(formatReviewerName("  ", "full", "en")).toBe("Anonymous customer");
  });
});

describe("parseReviewNameDisplay", () => {
  it("accepts valid values and defaults to first_initial", () => {
    expect(parseReviewNameDisplay("full")).toBe("full");
    expect(parseReviewNameDisplay("anonymous")).toBe("anonymous");
    expect(parseReviewNameDisplay("nope")).toBe("first_initial");
    expect(parseReviewNameDisplay(null)).toBe("first_initial");
  });
});
