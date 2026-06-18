"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { formatScore, formatPopulation } from "@/lib/utils";
import type { NeighborhoodResponse } from "@/lib/api/types";

const CityMap = dynamic(() => import("@/components/city-map"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 text-sm">Kaart laden...</div>,
});

interface CityContentProps {
  neighborhoods: NeighborhoodResponse[];
  cityName: string;
}

function scoreColorClass(score: number | null): string {
  if (score === null) return "text-zinc-400";
  if (score >= 8) return "text-emerald-600";
  if (score >= 7) return "text-emerald-500";
  if (score >= 6) return "text-amber-500";
  if (score >= 4) return "text-orange-500";
  return "text-red-500";
}

function categoryBadge(category: string | null): string {
  const map: Record<string, string> = {
    "Hoogste": "bg-emerald-100 text-emerald-800",
    "Zeer hoog": "bg-emerald-50 text-emerald-700",
    "Boven gemiddeld": "bg-amber-50 text-amber-700",
    "Onder gemiddeld": "bg-orange-50 text-orange-700",
    "Laagste": "bg-red-50 text-red-700",
  };
  return map[category ?? ""] ?? "bg-zinc-100 text-zinc-600";
}

export default function CityContent({
  neighborhoods,
  cityName,
}: CityContentProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNeighborhoodId === null) return;
    const el = listRef.current?.querySelector(`[data-id="${selectedNeighborhoodId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedNeighborhoodId]);

  const selectedNeighborhood = selectedNeighborhoodId
    ? neighborhoods.find((n) => n.id === selectedNeighborhoodId) ?? null
    : null;

  if (neighborhoods.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-3">
          <MapPin className="size-10 text-zinc-300 mx-auto" />
          <p className="text-zinc-500 text-sm font-medium">Data laden...</p>
          <Link href="/" className="text-xs text-emerald-600 hover:underline block">
            Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-zinc-100">
      <div className="absolute inset-0 z-0">
        <CityMap
          neighborhoods={neighborhoods}
          hoveredId={hoveredId}
          selectedId={selectedNeighborhoodId}
          onHover={setHoveredId}
          onSelect={setSelectedNeighborhoodId}
        />
      </div>

      <div className="absolute top-4 bottom-4 left-4 w-[calc(100%-2rem)] md:w-96 z-40 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col overflow-hidden border border-white/20">
        {selectedNeighborhood ? (
          <>
            <div className="shrink-0 p-5 border-b border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedNeighborhoodId(null)}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Terug naar overzicht
              </button>

              <p className="mt-2 text-xs text-zinc-400">#{selectedNeighborhood.rank}</p>
              <h2 className="text-xl font-bold text-zinc-900">
                {selectedNeighborhood.buurtnaam}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-center">
                <p className="text-5xl font-bold text-emerald-600">
                  {formatScore(selectedNeighborhood.score)}
                </p>
                <p className="text-sm text-zinc-500 mt-1">Score</p>
              </div>

              {selectedNeighborhood.population !== null && (
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4">
                  <span className="flex items-center gap-2 text-sm text-zinc-500">
                    <Users className="size-4" />
                    Inwoners
                  </span>
                  <span className="text-lg font-semibold text-zinc-900">
                    {formatPopulation(selectedNeighborhood.population)}
                  </span>
                </div>
              )}

              {selectedNeighborhood.details && (
                <div className="space-y-2 text-sm text-zinc-500">
                  {Object.entries(selectedNeighborhood.details)
                    .filter(([k]) => k !== "aantalinwoners" && k !== "population" && k !== "wijknaam")
                    .slice(0, 8)
                    .map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}</span>
                        <span className="font-medium text-zinc-700">
                          {typeof val === "number" ? formatPopulation(val) : String(val)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 border-b border-zinc-100 p-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 transition-colors mb-2"
              >
                <ArrowLeft className="size-3.5" />
                Alle steden
              </Link>

              <h1 className="text-lg font-bold text-zinc-900">
                Alle wijken in {cityName}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                {neighborhoods.length} wijken — gesorteerd op score
              </p>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto">
              {neighborhoods.map((n) => (
                <button
                  key={n.id}
                  data-id={n.id}
                  type="button"
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedNeighborhoodId(n.id)}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-zinc-50 cursor-pointer ${
                    hoveredId === n.id ? "bg-emerald-50" : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 w-8 text-sm font-bold text-zinc-300 text-right">
                      #{n.rank}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {n.buurtnaam}
                      </p>
                      {n.wijknaam !== n.buurtnaam && (
                        <p className="text-xs text-zinc-400 truncate">
                          {n.wijknaam}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${scoreColorClass(n.score)}`}>
                        {formatScore(n.score)}
                      </p>
                      {n.category && (
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryBadge(n.category)}`}>
                          {n.category}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="shrink-0 border-t border-zinc-100 p-3 text-center text-xs text-zinc-400 space-y-1">
              <p>Kaart door OpenStreetMap / CARTO</p>
              <a
                href="https://github.com/TriggerMinds/allesteden/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Feedback
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
