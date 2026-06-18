"use client";

import { useMemo, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { NeighborhoodResponse, GeoJsonGeometry } from "@/lib/api/types";
import type { PathOptions, GeoJSON as LeafletGeoJSON } from "leaflet";

type SortKey = "name" | "safetyScore" | "greenScore" | "quietScore";

interface CityMapProps {
  neighborhoods: NeighborhoodResponse[];
  selectedMetric: SortKey;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
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
          id: n.id,
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
  hoveredId,
  onHover,
}: CityMapProps) {
  const geoJsonData = useMemo(
    () => buildFeatureCollection(neighborhoods),
    [neighborhoods],
  );

  const getStyle = useCallback(
    (feature: unknown): PathOptions => {
      const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      const id = (props?.id as number) ?? -1;
      const score = (props?.[selectedMetric] as number | null) ?? null;

      if (id === hoveredId) {
        return {
          fillColor: getColor(score),
          weight: 3.5,
          opacity: 1,
          color: "#000000",
          fillOpacity: 0.95,
        };
      }

      return {
        fillColor: getColor(score),
        weight: 1.5,
        opacity: 1,
        color: "#374151",
        fillOpacity: 0.7,
      };
    },
    [selectedMetric, hoveredId],
  );

  const onEachFeature = useCallback(
    (feature: unknown, layer: unknown) => {
      const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      const id = (props?.id as number) ?? -1;
      const name = (props?.name as string) ?? "Onbekend";
      const safety = props?.safetyScore as number | null;
      const green = props?.greenScore as number | null;
      const quiet = props?.quietScore as number | null;

      const l = layer as LeafletGeoJSON;
      l.bindPopup(
        `<div class="text-sm font-sans">
          <strong class="text-base">${name}</strong><br/>
          🛡️ Veiligheid: ${safety?.toFixed(1) ?? "—"}<br/>
          🌿 Groen: ${green?.toFixed(1) ?? "—"}<br/>
          🤫 Rust: ${quiet?.toFixed(1) ?? "—"}
        </div>`,
      );
      l.on({
        mouseover: () => onHover(id),
        mouseout: () => onHover(null),
      });
    },
    [onHover],
  );

  return (
    <MapContainer
      center={[52.1326, 5.2913]}
      zoom={10}
      className="h-full w-full"
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        key={selectedMetric}
        data={geoJsonData}
        style={getStyle}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
