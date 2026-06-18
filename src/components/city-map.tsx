"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { NeighborhoodResponse, GeoJsonGeometry } from "@/lib/api/types";

type SortKey = "name" | "safetyScore" | "greenScore" | "quietScore";

interface CityMapProps {
  neighborhoods: NeighborhoodResponse[];
  selectedMetric: SortKey;
  cityName: string;
}

function getColor(score: number | null): string {
  if (score === null) return "#e4e4e7";
  if (score >= 8) return "#166534";
  if (score >= 6) return "#22c55e";
  if (score >= 4) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#dc2626";
}

function buildFeatureCollection(neighborhoods: NeighborhoodResponse[]) {
  return {
    type: "FeatureCollection" as const,
    features: neighborhoods
      .filter((n) => n.geometry)
      .map((n) => ({
        type: "Feature" as const,
        properties: {
          name: n.name,
          safetyScore: n.safetyScore,
          greenScore: n.greenScore,
          quietScore: n.quietScore,
        },
        geometry: n.geometry as GeoJsonGeometry,
      })),
  };
}

export default function CityMap({
  neighborhoods,
  selectedMetric,
}: CityMapProps) {
  const geoJsonData = useMemo(
    () => buildFeatureCollection(neighborhoods),
    [neighborhoods],
  );

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
      <MapContainer
        center={[52.1326, 5.2913]}
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={selectedMetric}
          data={geoJsonData}
          style={(feature) => {
            const p = feature?.properties as Record<string, unknown> | undefined;
            const score = p
              ? (p[selectedMetric] as number | null) ?? null
              : null;
            return {
              fillColor: getColor(score),
              weight: 1.5,
              opacity: 1,
              color: "#374151",
              fillOpacity: 0.7,
            };
          }}
          onEachFeature={(feature, layer) => {
            const p = feature.properties as Record<string, unknown>;
            const name = (p.name as string) ?? "Onbekend";
            const safety = p.safetyScore as number | null;
            const green = p.greenScore as number | null;
            const quiet = p.quietScore as number | null;

            layer.bindPopup(
              `<div class="text-sm font-sans">
                <strong class="text-base">${name}</strong><br/>
                🛡️ Veiligheid: ${safety?.toFixed(1) ?? "—"}<br/>
                🌿 Groen: ${green?.toFixed(1) ?? "—"}<br/>
                🤫 Rust: ${quiet?.toFixed(1) ?? "—"}
              </div>`,
            );
            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({ weight: 3, color: "#000", fillOpacity: 0.9 });
                l.bringToFront();
              },
              mouseout: (e) => {
                const l = e.target;
                l.setStyle({ weight: 1.5, color: "#374151", fillOpacity: 0.7 });
              },
            });
          }}
        />
      </MapContainer>
    </div>
  );
}
