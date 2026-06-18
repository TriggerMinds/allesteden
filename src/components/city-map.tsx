"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { NeighborhoodResponse, GeoJsonGeometry } from "@/lib/api/types";

interface CityMapProps {
  neighborhoods: NeighborhoodResponse[];
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number | null) => void;
}

const COLOR_STOPS = [
  { min: 0, max: 2, color: "#dc2626", label: "0 – 2" },
  { min: 2, max: 4, color: "#f97316", label: "2 – 4" },
  { min: 4, max: 6, color: "#eab308", label: "4 – 6" },
  { min: 6, max: 8, color: "#22c55e", label: "6 – 8" },
  { min: 8, max: 10, color: "#166534", label: "8 – 10" },
] as const;

function getScoreColor(score: number | null): string {
  if (score === null) return "#e4e4e7";
  if (score >= 8) return "#166534";
  if (score >= 7) return "#22c55e";
  if (score >= 6) return "#eab308";
  if (score >= 4) return "#f97316";
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
          name: n.buurtnaam,
          score: n.score,
        },
        geometry: n.geometry as GeoJsonGeometry,
      })),
  };
}

function LegendControl() {
  const map = useMap();
  const ctrlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (ctrlRef.current) {
      ctrlRef.current.remove();
    }

    const Legend = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create("div");
        div.style.cssText =
          "background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);padding:12px 14px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:system-ui,sans-serif;font-size:12px;min-width:160px;border:1px solid rgba(0,0,0,0.06)";

        const title = document.createElement("div");
        title.style.cssText = "font-weight:700;font-size:13px;color:#18181b;margin-bottom:8px";
        title.textContent = "Score";
        div.appendChild(title);

        for (const stop of COLOR_STOPS) {
          const row = document.createElement("div");
          row.style.cssText = "display:flex;align-items:center;gap:8px;padding:2px 0";

          const swatch = document.createElement("span");
          swatch.style.cssText = `display:inline-block;width:14px;height:14px;border-radius:3px;background:${stop.color};flex-shrink:0`;
          row.appendChild(swatch);

          const label = document.createElement("span");
          label.style.cssText = "color:#52525b";
          label.textContent = stop.label;
          row.appendChild(label);

          div.appendChild(row);
        }

        return div;
      },
    });

    const legend = new Legend({ position: "bottomright" });
    legend.addTo(map);
    ctrlRef.current = legend;

    return () => {
      legend.remove();
      ctrlRef.current = null;
    };
  }, [map]);

  return null;
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
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: CityMapProps) {
  const geoJsonData = useMemo(
    () => buildFeatureCollection(neighborhoods),
    [neighborhoods],
  );

  const getStyle = useCallback(
    (feature: unknown): L.PathOptions => {
      const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      const id = (props?.id as number) ?? -1;
      const score = (props?.score as number | null) ?? null;

      const isSelected = id === selectedId;
      const isHovered = id === hoveredId;

      const base: L.PathOptions = {
        fillColor: getScoreColor(score),
        weight: 1.2,
        opacity: 1,
        color: "#9ca3af",
        fillOpacity: 0.65,
      };

      if (isSelected) {
        return {
          ...base,
          weight: 4,
          color: "#18181b",
          fillOpacity: 0.92,
          dashArray: "8 4",
        };
      }
      if (isHovered) {
        return {
          ...base,
          weight: 3,
          color: "#059669",
          fillOpacity: 0.88,
        };
      }
      return base;
    },
    [hoveredId, selectedId],
  );

  const onEachFeature = useCallback(
    (feature: unknown, layer: unknown) => {
      const props = (feature as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      const id = (props?.id as number) ?? -1;

      const l = layer as L.GeoJSON;
      l.bindTooltip((props?.name as string) ?? "Onbekend", {
        direction: "top",
        offset: L.point(0, -8),
        className: "rounded-lg shadow-lg border border-zinc-200 bg-white/95 text-sm font-medium text-zinc-800 px-3 py-1.5",
      });

      const score = (props?.score as number | null) ?? null;
      l.bindPopup(
        `<div style="font-weight:700;font-size:15px;font-family:system-ui,sans-serif;color:#18181b;text-align:center">${props?.name ?? "Onbekend"}<br/><span style="font-size:24px;color:#059669">${score !== null ? score.toFixed(1) : "—"}</span></div>`,
        {
          maxWidth: 200,
          className: "custom-neighborhood-popup",
          closeButton: true,
        },
      );

      l.on({
        mouseover: () => onHover(id),
        mouseout: () => onHover(null),
        click: () => {
          onSelect(id === selectedId ? null : id);
        },
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
        data={geoJsonData}
        style={getStyle}
        onEachFeature={onEachFeature}
      />
      <MapController
        geoJsonData={geoJsonData}
        selectedId={selectedId}
        neighborhoods={neighborhoods}
      />
      <LegendControl />
    </MapContainer>
  );
}
