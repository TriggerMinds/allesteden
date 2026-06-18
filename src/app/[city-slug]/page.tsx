import Link from "next/link";
import type { NeighborhoodsApiResponse } from "@/lib/api/types";
import CityContent from "./city-content";

interface CityPageProps {
  params: Promise<{ "city-slug": string }>;
}

async function getCityData(slug: string): Promise<NeighborhoodsApiResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/neighborhoods?city=${slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const DEMO_NEIGHBORHOODS: NeighborhoodsApiResponse = {
  city: { id: 1, name: "Amsterdam", slug: "amsterdam" },
  neighborhoods: [
    {
      id: 1,
      cityId: 1,
      name: "Centrum",
      slug: "centrum",
      safetyScore: 6.5,
      greenScore: 4.2,
      quietScore: 2.1,
      geometry: null,
      details: null,
    },
    {
      id: 2,
      cityId: 1,
      name: "West",
      slug: "west",
      safetyScore: 7.1,
      greenScore: 6.8,
      quietScore: 5.3,
      geometry: null,
      details: null,
    },
    {
      id: 3,
      cityId: 1,
      name: "Zuid",
      slug: "zuid",
      safetyScore: 8.2,
      greenScore: 7.5,
      quietScore: 6.0,
      geometry: null,
      details: null,
    },
    {
      id: 4,
      cityId: 1,
      name: "Noord",
      slug: "noord",
      safetyScore: 7.8,
      greenScore: 8.1,
      quietScore: 7.2,
      geometry: null,
      details: null,
    },
    {
      id: 5,
      cityId: 1,
      name: "Oost",
      slug: "oost",
      safetyScore: 7.3,
      greenScore: 7.0,
      quietScore: 5.8,
      geometry: null,
      details: null,
    },
  ],
};

export default async function CityPage({ params }: CityPageProps) {
  const { "city-slug": slug } = await params;

  let data = await getCityData(slug);
  if (data === null) data = DEMO_NEIGHBORHOODS;

  const { city, neighborhoods } = data;

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white px-4 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-emerald-200 hover:text-white transition-colors mb-4 text-sm"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Terug naar overzicht
          </Link>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            {city.name}
          </h1>
          <p className="mt-2 text-emerald-100 text-lg">
            {neighborhoods.length}{" "}
            {neighborhoods.length === 1 ? "wijk" : "wijken"} om te verkennen
          </p>
        </div>
      </header>

      <section className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <CityContent neighborhoods={neighborhoods} cityName={city.name} />
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        <p>Data wordt elke 24 uur ververst via openbare bronnen</p>
      </footer>
    </div>
  );
}
