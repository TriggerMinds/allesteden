"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { NeighborhoodResponse, GeoJsonGeometry } from "@/lib/api/types";

type SortKey = "name" | "safetyScore" | "greenScore" | "quietScore" | "weighted";

interface CityMapProps {
  neighborhoods: NeighborhoodResponse[];
  selectedMetric: SortKey;
  hoveredId: number | null;
  selectedId: number | null;
  weightedScores: Record<number, number>;
  onHover: (id: number | null) => void;
  onSelect: (id: number | null) => void;
}

function getColor(score: number | null): string {
  if (score === null) return "#e4e4e7";
  if (score >= 8) return "#166534";
  if (score >= 6) return "#22c55e";
  if (score >= 4) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#dc2626";
}

function buildFeatureCollection(
  neighborhoods: NeighborhoodResponse[],
  weightedScores: Record<number, number>,
) {
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
          weightedScore: weightedScores[n.id] ?? null,
        },
        geometry: n.geometry as GeoJsonGeometry,
      })),
  };
}

function MapController({
  geoJsonData,
  selectedId,
  neighborhoods,
}: {
  geoJsonData: ReturnType<typeof buildFeatureCollection>;
  selectedId: number | null;
  neighborhoods: NeighborhoodResponse[];
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (neighborhoods.length === 0 || hasFitted.current) return;
    const geoLayer = L.geoJSON(geoJsonData as unknown as GeoJSON.GeoJSON);
    if (geoLayer.getLayers().length > 0) {
      map.fitBounds(geoLayer.getBounds(), { padding: [40, 40] });
      hasFitted.current = true;
    }
  }, [neighborhoods, geoJsonData, map]);

  useEffect(() => {
    if (selectedId === null) return;
    const feature = geoJsonData.features.find(
      (f) => f.properties.id === selectedId,
    );
    if (!feature) return;
    const geoLayer = L.geoJSON(feature as unknown as GeoJSON.GeoJSON);
    if (geoLayer.getLayers().length > 0) {
      map.flyToBounds(geoLayer.getBounds(), {
        padding: [60, 60],
        maxZoom: 15,
        duration: 0.8,
      });
    }
  }, [selectedId, geoJsonData, map]);

  return null;
}

export default function CityMap({
  neighborhoods,
  selectedMetric,
  hoveredId,
  selectedId,
  weightedScores,
  onHover,
  onSelect,
}: CityMapProps) {
  const geoJsonData = useMemo(
    () => buildFeatureCollection(neighborhoods, weightedScores),
    [neighborhoods, weightedScores],
  );

  const getStyle = useCallback(
    (feature: unknown): L.PathOptions => {
      const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      const id = (props?.id as number) ?? -1;
      const rawScore =
        selectedMetric === "weighted"
          ? (props?.weightedScore as number | null)
          : (props?.[selectedMetric] as number | null);
      const score = rawScore ?? null;

      const isSelected = id === selectedId;
      const isHovered = id === hoveredId;

      if (isSelected) {
        return {
          fillColor: getColor(score),
          weight: 4,
          opacity: 1,
          color: "#000000",
          fillOpacity: 0.95,
          dashArray: "6 3",
        };
      }
      if (isHovered) {
        return {
          fillColor: getColor(score),
          weight: 3.5,
          opacity: 1,
          color: "#000000",
          fillOpacity: 0.9,
        };
      }
      return {
        fillColor: getColor(score),
        weight: 1.2,
        opacity: 1,
        color: "#9ca3af",
        fillOpacity: 0.65,
      };
    },
    [selectedMetric, hoveredId, selectedId],
  );

  const onEachFeature = useCallback(
    (feature: unknown, layer: unknown) => {
      const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      const id = (props?.id as number) ?? -1;

      const l = layer as L.GeoJSON;
      l.on({
        mouseover: () => onHover(id),
        mouseout: () => onHover(null),
        click: () => onSelect(id === selectedId ? null : id),
      });
    },
    [onHover, onSelect, selectedId],
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
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <GeoJSON
        key={`${selectedMetric}-${JSON.stringify(weightedScores)}`}
        data={geoJsonData}
        style={getStyle}
        onEachFeature={onEachFeature}
      />
      <MapController
        geoJsonData={geoJsonData}
        selectedId={selectedId}
        neighborhoods={neighborhoods}
      />
    </MapContainer>
  );
}
