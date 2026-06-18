import { describe, it, expect } from "vitest";
import type { CitiesApiResponse, NeighborhoodsApiResponse, GeoJsonGeometry } from "@/lib/api/types";

describe("API Types — structural validation", () => {
  it("CitiesApiResponse shape is correct", () => {
    const response: CitiesApiResponse = {
      cities: [
        { id: 1, name: "Amsterdam", slug: "amsterdam", neighborhoodCount: 15 },
      ],
    };
    expect(response.cities).toHaveLength(1);
    expect(response.cities[0].name).toBe("Amsterdam");
  });

  it("NeighborhoodsApiResponse shape is correct", () => {
    const geometry: GeoJsonGeometry = {
      type: "MultiPolygon",
      coordinates: [[[[4.8, 52.3], [4.9, 52.4], [4.8, 52.3]]]],
    };

    const response: NeighborhoodsApiResponse = {
      city: { id: 1, name: "Amsterdam", slug: "amsterdam" },
      neighborhoods: [
        {
          id: 1,
          cityId: 1,
          name: "Centrum",
          slug: "centrum",
          safetyScore: 7.5,
          greenScore: 6.0,
          quietScore: 4.2,
          geometry,
          details: { aantalinwoners: 90000 },
        },
      ],
    };
    expect(response.neighborhoods[0].geometry?.type).toBe("MultiPolygon");
    expect(Array.isArray(response.neighborhoods[0].geometry?.coordinates)).toBe(true);
  });

  it("supports null scores", () => {
    const response: NeighborhoodsApiResponse = {
      city: { id: 1, name: "Test", slug: "test" },
      neighborhoods: [
        {
          id: 1,
          cityId: 1,
          name: "Test",
          slug: "test",
          safetyScore: null,
          greenScore: null,
          quietScore: null,
          geometry: null,
          details: null,
        },
      ],
    };
    response.neighborhoods.forEach((n) => {
      expect(n.safetyScore).toBeNull();
      expect(n.greenScore).toBeNull();
      expect(n.quietScore).toBeNull();
      expect(n.geometry).toBeNull();
    });
  });
});
