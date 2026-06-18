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
          rank: 1,
          wijknaam: "Centrum",
          buurtnaam: "Centrum",
          score: 7.5,
          population: 90000,
          category: "Hoogste",
          geometry,
          details: { aantalinwoners: 90000 },
        },
      ],
    };
    expect(response.neighborhoods[0].buurtnaam).toBe("Centrum");
    expect(response.neighborhoods[0].rank).toBe(1);
    expect(response.neighborhoods[0].score).toBe(7.5);
  });

  it("supports null scores and null geometry", () => {
    const response: NeighborhoodsApiResponse = {
      city: { id: 1, name: "Test", slug: "test" },
      neighborhoods: [
        {
          id: 1,
          cityId: 1,
          rank: 1,
          wijknaam: "Test",
          buurtnaam: "Test",
          score: null,
          population: null,
          category: null,
          geometry: null,
          details: null,
        },
      ],
    };
    response.neighborhoods.forEach((n) => {
      expect(n.score).toBeNull();
      expect(n.population).toBeNull();
      expect(n.category).toBeNull();
      expect(n.geometry).toBeNull();
    });
  });
});
