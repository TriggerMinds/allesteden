"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import NeighborhoodTable from "@/components/neighborhood-table";
import type { NeighborhoodResponse } from "@/lib/api/types";

type SortKey = "name" | "safetyScore" | "greenScore" | "quietScore";

const CityMap = dynamic(() => import("@/components/city-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 text-sm">
      Kaart laden...
    </div>
  ),
});

interface CityContentProps {
  neighborhoods: NeighborhoodResponse[];
  cityName: string;
}

export default function CityContent({
  neighborhoods,
  cityName,
}: CityContentProps) {
  const [selectedMetric, setSelectedMetric] = useState<SortKey>("safetyScore");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Wijken</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Klik op een kolomkop om te sorteren. De kaart kleurt mee met de
          geselecteerde score.
        </p>
        <NeighborhoodTable
          neighborhoods={neighborhoods}
          onSelectMetric={setSelectedMetric}
          selectedMetric={selectedMetric}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Kaart</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Kleuren op:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as SortKey)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="safetyScore">Veiligheid</option>
              <option value="greenScore">Groen</option>
              <option value="quietScore">Rust</option>
            </select>
          </div>
        </div>
        <CityMap
          neighborhoods={neighborhoods}
          selectedMetric={selectedMetric}
          cityName={cityName}
        />
      </div>
    </div>
  );
}
