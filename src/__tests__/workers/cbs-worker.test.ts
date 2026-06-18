import { describe, it, expect } from "vitest";

function determineSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

describe("CBS Worker — determineSlug", () => {
  it("converts a simple name to lowercase slug", () => {
    expect(determineSlug("Amsterdam")).toBe("amsterdam");
  });

  it("replaces spaces with hyphens", () => {
    expect(determineSlug("Den Haag")).toBe("den-haag");
  });

  it("handles special characters", () => {
    expect(determineSlug("'s-Hertogenbosch")).toBe("s-hertogenbosch");
  });

  it("removes leading and trailing hyphens", () => {
    expect(determineSlug("!Utrecht!")).toBe("utrecht");
  });

  it("handles multiple consecutive spaces", () => {
    expect(determineSlug("  Rotterdam  ")).toBe("rotterdam");
  });

  it("handles diacritics", () => {
    expect(determineSlug("Breda")).toBe("breda");
  });
});
