"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { formatScore, formatPopulation } from "@/lib/utils";
import type { NeighborhoodResponse } from "@/lib/api/types";

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
    Hoogste: "bg-emerald-100 text-emerald-800",
    "Zeer hoog": "bg-emerald-50 text-emerald-700",
    "Boven gemiddeld": "bg-amber-50 text-amber-700",
    "Onder gemiddeld": "bg-orange-50 text-orange-700",
    Laagste: "bg-red-50 text-red-700",
  };
  return map[category ?? ""] ?? "bg-zinc-100 text-zinc-600";
}

export default function CityContent({
  neighborhoods,
  cityName,
}: CityContentProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<
    number | null
  >(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNeighborhoodId === null) return;
    const el = listRef.current?.querySelector(
      `[data-id="${selectedNeighborhoodId}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedNeighborhoodId]);

  const selectedNeighborhood = selectedNeighborhoodId
    ? neighborhoods.find((n) => n.id === selectedNeighborhoodId) ?? null
    : null;

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

              <p className="mt-2 text-xs text-zinc-400">
                #{selectedNeighborhood.rank}
              </p>
              <h2 className="text-xl font-bold text-zinc-900">
                {selectedNeighborhood.buurtnaam}
              </h2>
              {selectedNeighborhood.wijknaam !== selectedNeighborhood.buurtnaam && (
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedNeighborhood.wijknaam}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="text-center">
                <p className="text-5xl font-bold text-emerald-600">
                  {formatScore(selectedNeighborhood.score)}
                </p>
                <p className="text-sm text-zinc-500 mt-1">Score</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Sociale veiligheid", value: selectedNeighborhood.socialSafetyScore, color: "text-orange-600", bg: "bg-orange-50" },
                  { label: "Inbraak & diefstal", value: selectedNeighborhood.theftSafetyScore, color: "text-red-600", bg: "bg-red-50" },
                  { label: "Rust & overlast", value: selectedNeighborhood.quietScore, color: "text-sky-600", bg: "bg-sky-50" },
                  { label: "Groen in de wijk", value: selectedNeighborhood.greenScore, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Bereikbaarheid", value: selectedNeighborhood.accessibilityScore, color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Horeca", value: selectedNeighborhood.hospitalityScore, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Dagelijkse boodschappen", value: selectedNeighborhood.dailyShoppingScore, color: "text-lime-600", bg: "bg-lime-50" },
                  { label: "Leefbaarometer", value: selectedNeighborhood.leefbaarometerScore, color: "text-teal-600", bg: "bg-teal-50" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
                    <p className={`text-lg font-bold ${color}`}>{formatScore(value)}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {selectedNeighborhood.population !== null && (
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-sm">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Users className="size-4" />
                    Inwoners
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {formatPopulation(selectedNeighborhood.population)}
                  </span>
                </div>
              )}

              {(() => {
                const d = selectedNeighborhood.details;
                if (!d) return null;
                const pct = (v: unknown) => typeof v === "number" ? v + "%" : null;
                type RowEl = React.JSX.Element | null;
                const Row = ({ l, v }: { l: string | null; v: string | null }) => v != null ? (
                  <div className="flex justify-between text-xs py-0.5">
                    <span className="text-zinc-500">{l}</span>
                    <span className="font-medium text-zinc-700">{v}</span>
                  </div>
                ) : null;

                const sections: { title: string; rows: RowEl[] }[] = [];

                const b1 = [Row({ l: "Tot 2000", v: pct(d.percentage_bouwjaarklasse_tot_2000) }), Row({ l: "2000+", v: pct(d.percentage_bouwjaarklasse_vanaf_2000) })].filter(Boolean);
                if (b1.length) sections.push({ title: "Bouwjaren", rows: b1 });

                const b2 = [Row({ l: "Eengezinswoning", v: pct(d.percentage_eengezinswoning) }), Row({ l: "Meergezinswoning", v: pct(d.percentage_meergezinswoning) }), Row({ l: "Koopwoning", v: pct(d.percentage_koopwoningen) }), Row({ l: "Huurwoning", v: pct(d.percentage_huurwoningen) })].filter(Boolean);
                if (b2.length) sections.push({ title: "Type woningen", rows: b2 });

                const b3 = [Row({ l: "Alleenstaand", v: pct(d.percentage_eenpersoonshuishoudens) }), Row({ l: "Met kinderen", v: pct(d.percentage_huishoudens_met_kinderen) }), Row({ l: "Zonder kinderen", v: pct(d.percentage_huishoudens_zonder_kinderen) })].filter(Boolean);
                if (b3.length) sections.push({ title: "Huishoudens", rows: b3 });

                const b4 = [Row({ l: "0-14 jaar", v: pct(d.percentage_personen_0_tot_15_jaar) }), Row({ l: "15-24 jaar", v: pct(d.percentage_personen_15_tot_25_jaar) }), Row({ l: "25-44 jaar", v: pct(d.percentage_personen_25_tot_45_jaar) }), Row({ l: "45-64 jaar", v: pct(d.percentage_personen_45_tot_65_jaar) }), Row({ l: "65+", v: pct(d.percentage_personen_65_jaar_en_ouder) })].filter(Boolean);
                if (b4.length) sections.push({ title: "Leeftijden", rows: b4 });

                const b5 = [Row({ l: "Nederland", v: pct(d.percentage_met_herkomstland_nederland) }), Row({ l: "Europa excl. NL", v: pct(d.percentage_met_herkomstland_uit_europa_excl_nl) }), Row({ l: "Buiten Europa", v: pct(d.percentage_met_herkomstland_buiten_europa) })].filter(Boolean);
                if (b5.length) sections.push({ title: "Herkomst inwoners", rows: b5 });

                const codes: RowEl[] = [];
                if (d.wijkcode) codes.push(Row({ l: "Wijkcode", v: String(d.wijkcode) }));
                if (d.buurtcode) codes.push(Row({ l: "Buurtcode", v: String(d.buurtcode) }));

                return (
                  <>
                    {sections.map((s) => (
                      <div key={s.title}>
                        <h4 className="text-xs font-semibold text-zinc-700 mb-1">{s.title}</h4>
                        <div className="rounded-lg bg-zinc-50 px-3 py-2">{s.rows}</div>
                      </div>
                    ))}
                    {codes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-700 mb-1">Gebiedscodes</h4>
                        <div className="rounded-lg bg-zinc-50 px-3 py-2">{codes}</div>
                      </div>
                    )}
                  </>
                );
              })()}
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
              {neighborhoods.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div className="space-y-3">
                    <MapPin className="size-10 text-zinc-300 mx-auto" />
                    <p className="text-zinc-500 text-sm font-medium">
                      Data laden...
                    </p>
                    <p className="text-xs text-zinc-400">
                      Er zijn nog geen buurtrecords voor deze stad beschikbaar.
                    </p>
                  </div>
                </div>
              ) : (
                neighborhoods.map((n) => (
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
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryBadge(
                              n.category,
                            )}`}
                          >
                            {n.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-100 p-3 text-center text-xs text-zinc-400 space-y-1">
              <p>Kaart laden...</p>
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
