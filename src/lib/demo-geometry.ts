import type { GeoJsonGeometry } from "./api/types";

function square(centerLat: number, centerLng: number, sizeDeg: number): GeoJsonGeometry {
  const half = sizeDeg / 2;
  return {
    type: "Polygon",
    coordinates: [[
      [centerLng - half, centerLat - half],
      [centerLng + half, centerLat - half],
      [centerLng + half, centerLat + half],
      [centerLng - half, centerLat + half],
      [centerLng - half, centerLat - half],
    ]],
  };
}

// Amsterdam approximate center: 52.372, 4.895
export const DEMO_GEOMETRIES: Record<string, GeoJsonGeometry> = {
  "centrum": square(52.372, 4.895, 0.025),
  "west": square(52.372, 4.85, 0.03),
  "zuid": square(52.345, 4.885, 0.03),
  "noord": square(52.400, 4.895, 0.03),
  "oost": square(52.365, 4.935, 0.03),
  "nieuw-west": square(52.370, 4.80, 0.03),
  "zuidoost": square(52.315, 4.955, 0.03),
  "buitenveldert": square(52.330, 4.875, 0.025),
  "ijburg": square(52.355, 5.000, 0.025),
  "slotervaart": square(52.355, 4.80, 0.025),
  "bos-en-lommer": square(52.380, 4.835, 0.02),
  "de-pijp": square(52.353, 4.890, 0.018),
  "jordaan": square(52.375, 4.880, 0.015),
  "watergraafsmeer": square(52.355, 4.925, 0.022),
  "geuzenveld": square(52.370, 4.825, 0.02),
  "osdorp": square(52.365, 4.770, 0.028),
  "zeeburg": square(52.365, 4.970, 0.025),
  "bijlmer-centrum": square(52.315, 4.955, 0.02),
  "noordelijke-ij-oevers": square(52.388, 4.890, 0.022),
  "station-omgeving": square(52.379, 4.900, 0.015),
};
