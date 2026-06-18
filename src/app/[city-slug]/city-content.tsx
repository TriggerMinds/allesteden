"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Search, ArrowUpDown } from "lucide-react";
import NeighborhoodCard from "@/components/neighborhood-card";
import type { NeighborhoodResponse } from "@/lib/api/types";

type SortKey = "name" | "safetyScore" | "greenScore" | "quietScore";

const CityMap = dynamic(() => import("@/components/city-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 text-sm">
      Kaart laden...
    </div>
  ),
});

interface CityContentProps {
  neighborhoods: NeighborhoodResponse[];
  cityName: string;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "safetyScore", label: "Veiligheid" },
  { key: "greenScore", label: "Groen" },
  { key: "quietScore", label: "Rust" },
  { key: "name", label: "Naam" },
];

export default function CityContent({
  neighborhoods,
  cityName,
}: CityContentProps) {
  const [selectedMetric, setSelectedMetric] = useState<SortKey>("safetyScore");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedAndFiltered = useMemo(() => {
    const filtered = searchQuery
      ? neighborhoods.filter((n) =>
          n.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [...neighborhoods];

    filtered.sort((a, b) => {
      if (selectedMetric === "name") {
        return a.name.localeCompare(b.name, "nl");
      }
      const aVal = a[selectedMetric];
      const bVal = b[selectedMetric];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return bVal - aVal;
    });

    return filtered;
  }, [neighborhoods, searchQuery, selectedMetric]);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-zinc-100">
      <div className="absolute inset-0 z-0">
        <CityMap
          neighborhoods={neighborhoods}
          selectedMetric={selectedMetric}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>

      <div className="absolute top-4 bottom-4 left-4 w-[calc(100%-2rem)] md:w-96 z-40 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col overflow-hidden border border-white/20">
        <div className="shrink-0 border-b border-zinc-100 p-4 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Terug naar overzicht
          </Link>

          <h1 className="text-lg font-bold text-zinc-900">{cityName}</h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek wijk of buurt..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-3.5 text-zinc-400 shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedMetric(opt.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedMetric === opt.key
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            {sortedAndFiltered.length}{" "}
            {sortedAndFiltered.length === 1 ? "wijk" : "wijken"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {sortedAndFiltered.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-8">
              Geen wijken gevonden
            </p>
          )}
          {sortedAndFiltered.map((n, i) => (
            <NeighborhoodCard
              key={n.id}
              neighborhood={n}
              rank={i + 1}
              isHovered={hoveredId === n.id}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(n.id === hoveredId ? null : n.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
