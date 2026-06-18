"use client";

import { useState, useMemo } from "react";
import type { NeighborhoodResponse } from "@/lib/api/types";

type SortKey = "name" | "safetyScore" | "greenScore" | "quietScore";

interface NeighborhoodTableProps {
  neighborhoods: NeighborhoodResponse[];
  onSelectMetric: (metric: SortKey) => void;
  selectedMetric: SortKey;
}

function formatScore(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1);
}

function scoreColor(value: number | null): string {
  if (value === null) return "bg-zinc-100 text-zinc-400";
  if (value >= 7) return "bg-emerald-100 text-emerald-800";
  if (value >= 4) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function NeighborhoodTable({
  neighborhoods,
  onSelectMetric,
  selectedMetric,
}: NeighborhoodTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("safetyScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...neighborhoods];
    copy.sort((a, b) => {
      if (sortKey === "name") {
        return sortDir === "desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return copy;
  }, [neighborhoods, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    onSelectMetric(key);
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return sortDir === "desc" ? " ↓" : " ↑";
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th
              className="cursor-pointer px-4 py-3 font-semibold hover:text-zinc-900"
              onClick={() => toggleSort("name")}
            >
              Wijk{sortIndicator("name")}
            </th>
            <th
              className={`cursor-pointer px-4 py-3 font-semibold hover:text-zinc-900 ${
                selectedMetric === "safetyScore"
                  ? "text-emerald-700"
                  : ""
              }`}
              onClick={() => toggleSort("safetyScore")}
            >
              Veiligheid{sortIndicator("safetyScore")}
            </th>
            <th
              className={`cursor-pointer px-4 py-3 font-semibold hover:text-zinc-900 ${
                selectedMetric === "greenScore" ? "text-emerald-700" : ""
              }`}
              onClick={() => toggleSort("greenScore")}
            >
              Groen{sortIndicator("greenScore")}
            </th>
            <th
              className={`cursor-pointer px-4 py-3 font-semibold hover:text-zinc-900 ${
                selectedMetric === "quietScore" ? "text-emerald-700" : ""
              }`}
              onClick={() => toggleSort("quietScore")}
            >
              Rust{sortIndicator("quietScore")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sorted.map((n) => (
            <tr
              key={n.id}
              className="hover:bg-zinc-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-zinc-900">
                {n.name}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColor(n.safetyScore)}`}
                >
                  {formatScore(n.safetyScore)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColor(n.greenScore)}`}
                >
                  {formatScore(n.greenScore)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColor(n.quietScore)}`}
                >
                  {formatScore(n.quietScore)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
