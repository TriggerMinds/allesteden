import { describe, it, expect } from "vitest";

function parseLocationCode(locationCode: string): { neighborhoodSlug?: string; cityName?: string } {
  const parts = locationCode.split(" ");
  if (parts.length >= 2) {
    return {
      neighborhoodSlug: parts[0]?.toLowerCase(),
      cityName: parts.slice(1).join(" "),
    };
  }
  return {};
}

describe("Police Worker — parseLocationCode", () => {
  it("extracts neighborhood slug and city name", () => {
    const result = parseLocationCode("BU012345 Amsterdam");
    expect(result.neighborhoodSlug).toBe("bu012345");
    expect(result.cityName).toBe("Amsterdam");
  });

  it("handles multi-word city names", () => {
    const result = parseLocationCode("BU543210 Den Haag");
    expect(result.neighborhoodSlug).toBe("bu543210");
    expect(result.cityName).toBe("Den Haag");
  });

  it("returns empty object for invalid input", () => {
    const result = parseLocationCode("Invalid");
    expect(result).toEqual({});
  });

  it("handles empty string", () => {
    const result = parseLocationCode("");
    expect(result).toEqual({});
  });
});
