"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  Sliders,
  Shield,
  Users,
  TreeDeciduous,
  Ear,
  Euro,
  Medal,
} from "lucide-react";
import type { NeighborhoodResponse } from "@/lib/api/types";

type SortKey =
  | "name"
  | "safetyScore"
  | "theftSafetyScore"
  | "socialSafetyScore"
  | "greenScore"
  | "quietScore"
  | "weighted";

interface WeightState {
  theft: number;
  social: number;
  green: number;
  quiet: number;
}

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

function formatScore(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1);
}

function getDetailsValue(
  details: Record<string, unknown> | null,
  key: string,
): number | null {
  if (!details) return null;
  const val = details[key];
  if (typeof val === "number") return val;
  return null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toLocaleString("nl-NL");
}

const DEFAULT_WEIGHTS: WeightState = {
  theft: 25,
  social: 25,
  green: 25,
  quiet: 25,
};

function weightedScore(n: NeighborhoodResponse, w: WeightState): number {
  const t = (n.theftSafetyScore ?? 5) * (w.theft / 100);
  const s = (n.socialSafetyScore ?? 5) * (w.social / 100);
  const g = (n.greenScore ?? 5) * (w.green / 100);
  const q = (n.quietScore ?? 5) * (w.quiet / 100);
  return Math.round((t + s + g + q) * 10) / 10;
}

export default function CityContent({
  neighborhoods,
  cityName,
}: CityContentProps) {
  const [selectedMetric, setSelectedMetric] = useState<SortKey>("weighted");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] =
    useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [weights, setWeights] = useState<WeightState>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);

  const weightedScores = useMemo(() => {
    const map: Record<number, number> = {};
    for (const n of neighborhoods) {
      map[n.id] = weightedScore(n, weights);
    }
    return map;
  }, [neighborhoods, weights]);

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
      if (selectedMetric === "weighted") {
        return (weightedScores[b.id] ?? 0) - (weightedScores[a.id] ?? 0);
      }
      const aVal = a[selectedMetric];
      const bVal = b[selectedMetric];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return bVal - aVal;
    });

    return filtered;
  }, [neighborhoods, searchQuery, selectedMetric, weightedScores]);

  function updateWeight(key: keyof WeightState, value: number) {
    setWeights((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  }

  const selectedNeighborhood = selectedNeighborhoodId
    ? neighborhoods.find((n) => n.id === selectedNeighborhoodId) ?? null
    : null;

  const detailPopulation = selectedNeighborhood
    ? getDetailsValue(selectedNeighborhood.details, "aantalinwoners")
    : null;
  const detailIncome = selectedNeighborhood
    ? getDetailsValue(selectedNeighborhood.details, "inkomen")
    : null;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-zinc-100">
      <div className="absolute inset-0 z-0">
        <CityMap
          neighborhoods={neighborhoods}
          selectedMetric={selectedMetric}
          hoveredId={hoveredId}
          selectedId={selectedNeighborhoodId}
          weightedScores={weightedScores}
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
                Terug naar lijst
              </button>

              <h2 className="mt-3 text-xl font-bold text-zinc-900">
                {selectedNeighborhood.name}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <Shield className="size-5 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-zinc-900">
                    {formatScore(selectedNeighborhood.theftSafetyScore)}
                  </p>
                  <p className="text-xs text-zinc-500">Woninginbraken</p>
                </div>
                <div className="rounded-xl bg-orange-50 p-4 text-center">
                  <Users className="size-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-zinc-900">
                    {formatScore(selectedNeighborhood.socialSafetyScore)}
                  </p>
                  <p className="text-xs text-zinc-500">Sociale veiligheid</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <TreeDeciduous className="size-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-zinc-900">
                    {formatScore(selectedNeighborhood.greenScore)}
                  </p>
                  <p className="text-xs text-zinc-500">Groen</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-4 text-center">
                  <Ear className="size-5 text-sky-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-zinc-900">
                    {formatScore(selectedNeighborhood.quietScore)}
                  </p>
                  <p className="text-xs text-zinc-500">Rust</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-violet-50 p-4 text-center">
                  <Users className="size-5 text-violet-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-zinc-900">
                    {detailPopulation !== null
                      ? formatNumber(detailPopulation)
                      : "—"}
                  </p>
                  <p className="text-xs text-zinc-500">Inwoners</p>
                </div>
                {detailIncome !== null && (
                  <div className="rounded-xl bg-zinc-50 p-4 text-center">
                    <Euro className="size-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-zinc-900">
                      €{formatNumber(detailIncome)}
                    </p>
                    <p className="text-xs text-zinc-500">Inkomen</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 border-b border-zinc-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  Terug naar overzicht
                </Link>
                <button
                  type="button"
                  onClick={() => setShowWeights(!showWeights)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showWeights
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <Sliders className="size-4" />
                </button>
              </div>

              <h1 className="text-lg font-bold text-zinc-900">{cityName}</h1>

              {showWeights && (
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700">
                      Jouw voorkeuren
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWeights(DEFAULT_WEIGHTS);
                        setSelectedMetric("weighted");
                      }}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                  {(
                    [
                      { key: "theft" as const, label: "Woninginbraken", icon: Shield, color: "text-red-500" },
                      { key: "social" as const, label: "Sociale veiligheid", icon: Users, color: "text-orange-500" },
                      { key: "green" as const, label: "Groen", icon: TreeDeciduous, color: "text-emerald-500" },
                      { key: "quiet" as const, label: "Rust", icon: Ear, color: "text-sky-500" },
                    ] as const
                  ).map(({ key, label, icon: Icon, color }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Icon className={`size-3.5 ${color}`} />
                          {label}
                        </span>
                        <span className="text-xs font-semibold text-zinc-800">
                          {weights[key]}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={weights[key]}
                        onChange={(e) =>
                          updateWeight(key, Number(e.target.value))
                        }
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-600 bg-zinc-200"
                      />
                    </div>
                  ))}
                </div>
              )}

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
                  {[
                    { key: "weighted" as SortKey, label: "Totaal" },
                    { key: "theftSafetyScore" as SortKey, label: "Inbraken" },
                    { key: "socialSafetyScore" as SortKey, label: "Sociaal" },
                    { key: "greenScore" as SortKey, label: "Groen" },
                    { key: "quietScore" as SortKey, label: "Rust" },
                    { key: "name" as SortKey, label: "Naam" },
                  ].map((opt) => (
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
                {selectedMetric === "weighted" && " — gesorteerd op totaalscore"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {sortedAndFiltered.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-8">
                  Geen wijken gevonden
                </p>
              )}
              {sortedAndFiltered.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedNeighborhoodId(n.id)}
                  className={`w-full text-left rounded-xl p-4 transition-all cursor-pointer border ${
                    hoveredId === n.id
                      ? "border-emerald-400 bg-emerald-50 shadow-md"
                      : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i < 3
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {i < 3 ? <Medal className="size-3.5" /> : `#${i + 1}`}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-zinc-900 truncate">
                          {n.name}
                        </h3>
                        {selectedMetric === "weighted" && (
                          <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                            {formatScore(weightedScores[n.id])}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="size-3.5 text-red-400" />
                          <span className="font-medium text-zinc-700">
                            {formatScore(n.theftSafetyScore)}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5 text-orange-400" />
                          <span className="font-medium text-zinc-700">
                            {formatScore(n.socialSafetyScore)}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TreeDeciduous className="size-3.5 text-emerald-500" />
                          <span>{formatScore(n.greenScore)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Ear className="size-3.5 text-sky-500" />
                          <span>{formatScore(n.quietScore)}</span>
                        </span>
                        {(() => {
                          const pop = getDetailsValue(
                            n.details,
                            "aantalinwoners",
                          );
                          return pop !== null ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3.5 text-violet-500" />
                              <span>{formatNumber(pop)}</span>
                            </span>
                          ) : null;
                        })()}
                        {(() => {
                          const inc = getDetailsValue(n.details, "inkomen");
                          return inc !== null ? (
                            <span className="inline-flex items-center gap-1">
                              <Euro className="size-3.5 text-green-600" />
                              <span>€{formatNumber(inc)}</span>
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
