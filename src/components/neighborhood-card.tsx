"use client";

import { Star, TreeDeciduous, Ear, Users, Euro, Medal } from "lucide-react";
import type { NeighborhoodResponse } from "@/lib/api/types";

interface NeighborhoodCardProps {
  neighborhood: NeighborhoodResponse;
  rank: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

function formatScore(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1);
}

function getDetailsValue(details: Record<string, unknown> | null, key: string): number | null {
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

export default function NeighborhoodCard({
  neighborhood,
  rank,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: NeighborhoodCardProps) {
  const population = getDetailsValue(neighborhood.details, "aantalinwoners");
  const income = getDetailsValue(neighborhood.details, "inkomen");

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 transition-all cursor-pointer border ${
        isHovered
          ? "border-emerald-400 bg-emerald-50 shadow-md"
          : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            rank <= 3
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {rank <= 3 ? <Medal className="size-3.5" /> : `#${rank}`}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 truncate">
            {neighborhood.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 text-amber-400" />
              <span className="font-medium text-zinc-700">
                {formatScore(neighborhood.safetyScore)}
              </span>
            </span>

            <span className="inline-flex items-center gap-1">
              <TreeDeciduous className="size-3.5 text-emerald-500" />
              <span>{formatScore(neighborhood.greenScore)}</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <Ear className="size-3.5 text-sky-500" />
              <span>{formatScore(neighborhood.quietScore)}</span>
            </span>

            {population !== null && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5 text-violet-500" />
                <span>{formatNumber(population)}</span>
              </span>
            )}

            {income !== null && (
              <span className="inline-flex items-center gap-1">
                <Euro className="size-3.5 text-green-600" />
                <span>€{formatNumber(income)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
