import SearchBar from "@/components/search-bar";
import CityCard from "@/components/city-card";
import type { CitiesApiResponse } from "@/lib/api/types";

async function getCities(): Promise<CitiesApiResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/cities`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { cities: [] };
    return res.json();
  } catch {
    return { cities: [] };
  }
}

const DEMO_CITIES: CitiesApiResponse["cities"] = [
  { id: 1, name: "Amsterdam", slug: "amsterdam", neighborhoodCount: 15 },
  { id: 2, name: "Rotterdam", slug: "rotterdam", neighborhoodCount: 14 },
  { id: 3, name: "Utrecht", slug: "utrecht", neighborhoodCount: 10 },
  { id: 4, name: "Den Haag", slug: "den-haag", neighborhoodCount: 12 },
  { id: 5, name: "Eindhoven", slug: "eindhoven", neighborhoodCount: 9 },
  { id: 6, name: "Groningen", slug: "groningen", neighborhoodCount: 8 },
];

export default async function HomePage() {
  let cities: CitiesApiResponse["cities"];

  try {
    const data = await getCities();
    cities = data.cities.length > 0 ? data.cities : DEMO_CITIES;
  } catch {
    cities = DEMO_CITIES;
  }

  return (
    <div className="flex flex-col flex-1">
      <section className="relative flex flex-col items-center justify-center px-4 py-24 sm:py-32 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]" />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Allesteden
          </h1>
          <p className="text-lg text-emerald-100 sm:text-xl max-w-lg">
            Ontdek en vergelijk alle wijken en buurten in Nederland. De beste
            plek om te wonen, gebaseerd op data.
          </p>
          <SearchBar />
        </div>
      </section>

      <section className="flex-1 w-full max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8">
          Populaire steden
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <CityCard
              key={city.slug}
              name={city.name}
              slug={city.slug}
              neighborhoodCount={city.neighborhoodCount}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        <p>Allesteden — Open data van CBS, PDOK, Politie en Leefbaarometer</p>
      </footer>
    </div>
  );
}
