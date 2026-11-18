import { describe, expect, it } from "vitest";
import { isAllowedOrigin, parseTrackEvent } from "./track-validation";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

describe("parseTrackEvent", () => {
  it("accepts valid events and normalizes trailing slashes", () => {
    expect(parseTrackEvent({ path: "/", locale: "fr" })).toEqual({ path: "/", locale: "fr" });
    expect(parseTrackEvent({ path: "/products/gecko-leopard/", locale: "en" })).toEqual({
      path: "/products/gecko-leopard",
      locale: "en",
    });
  });
  it.each([
    [null], ["x"], [[]], [{}],
    [{ path: "/x", locale: "de" }],
    [{ path: "/x" }],
    [{ path: 42, locale: "fr" }],
    [{ path: "", locale: "fr" }],
    [{ path: "no-leading-slash", locale: "fr" }],
    [{ path: "/a?x=1", locale: "fr" }],
    [{ path: "/a#frag", locale: "fr" }],
    [{ path: "/a b", locale: "fr" }],
    [{ path: "/a\n", locale: "fr" }],
    [{ path: "//evil.com", locale: "fr" }],
    [{ path: "/a/../b", locale: "fr" }],
    [{ path: "/" + "a".repeat(200), locale: "fr" }],
  ])("rejects %j", (input) => {
    expect(parseTrackEvent(input)).toBeNull();
  });
  it("accepts a path at the length limit", () => {
    expect(parseTrackEvent({ path: "/" + "a".repeat(199), locale: "fr" })).not.toBeNull();
  });
});

describe("isAllowedOrigin", () => {
  it("allows same-origin browser requests", () => {
    expect(isAllowedOrigin(h({ origin: "https://reptiles-concept.ca", host: "reptiles-concept.ca", "sec-fetch-site": "same-origin" }))).toBe(true);
  });
  it("rejects cross-site requests", () => {
    expect(isAllowedOrigin(h({ origin: "https://evil.example", host: "reptiles-concept.ca" }))).toBe(false);
    expect(isAllowedOrigin(h({ "sec-fetch-site": "cross-site", host: "reptiles-concept.ca" }))).toBe(false);
  });
  it("prefers x-forwarded-host and rejects a malformed Origin", () => {
    expect(isAllowedOrigin(h({ origin: "https://a.ca", "x-forwarded-host": "a.ca", host: "internal" }))).toBe(true);
    expect(isAllowedOrigin(h({ origin: "not a url", host: "a.ca" }))).toBe(false);
  });
  it("accepts requests with no Origin header (non-browser clients)", () => {
    expect(isAllowedOrigin(h({ host: "a.ca" }))).toBe(true);
  });
});
