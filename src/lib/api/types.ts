export interface GeoJsonGeometry {
  type: string;
  coordinates: number[][][] | number[][][][];
}

export interface CityResponse {
  id: number;
  name: string;
  slug: string;
  neighborhoodCount: number;
}

export interface NeighborhoodResponse {
  id: number;
  cityId: number;
  rank: number;
  wijknaam: string;
  buurtnaam: string;
  score: number | null;
  population: number | null;
  category: string | null;
  geometry: GeoJsonGeometry | null;
  details: Record<string, unknown> | null;
}

export interface CitiesApiResponse {
  cities: CityResponse[];
}

export interface NeighborhoodsApiResponse {
  city: {
    id: number;
    name: string;
    slug: string;
  };
  neighborhoods: NeighborhoodResponse[];
}

export interface ErrorApiResponse {
  error: string;
  status: number;
}
