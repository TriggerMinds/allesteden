import SearchBar from "@/components/search-bar";
import CityCard from "@/components/city-card";
import Link from "next/link";
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
  { id: 7, name: "Almere", slug: "almere", neighborhoodCount: 7 },
  { id: 8, name: "Breda", slug: "breda", neighborhoodCount: 6 },
  { id: 9, name: "Delft", slug: "delft", neighborhoodCount: 5 },
  { id: 10, name: "Haarlem", slug: "haarlem", neighborhoodCount: 8 },
  { id: 11, name: "Maastricht", slug: "maastricht", neighborhoodCount: 7 },
  { id: 12, name: "Nijmegen", slug: "nijmegen", neighborhoodCount: 6 },
  { id: 13, name: "Tilburg", slug: "tilburg", neighborhoodCount: 9 },
  { id: 14, name: "Arnhem", slug: "arnhem", neighborhoodCount: 7 },
  { id: 15, name: "Amersfoort", slug: "amersfoort", neighborhoodCount: 6 },
  { id: 16, name: "Enschede", slug: "enschede", neighborhoodCount: 7 },
  { id: 17, name: "Zwolle", slug: "zwolle", neighborhoodCount: 5 },
  { id: 18, name: "Den Bosch", slug: "den-bosch", neighborhoodCount: 6 },
];

function groupByFirstLetter(cities: CitiesApiResponse["cities"]): Map<string, typeof cities> {
  const groups = new Map<string, typeof cities>();
  for (const city of cities) {
    const letter = city.name.charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(city);
  }
  return groups;
}

export default async function HomePage() {
  let cities: CitiesApiResponse["cities"];

  try {
    const data = await getCities();
    cities = data.cities.length > 0 ? data.cities : DEMO_CITIES;
  } catch {
    cities = DEMO_CITIES;
  }

  const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name, "nl"));

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

      <section className="w-full max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8">
          Populaire steden
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.slice(0, 6).map((city) => (
            <CityCard
              key={city.slug}
              name={city.name}
              slug={city.slug}
              neighborhoodCount={city.neighborhoodCount}
            />
          ))}
        </div>
      </section>

      <section className="w-full bg-zinc-50 border-t border-zinc-200 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Ontdek steden in Nederland
          </h2>
          <p className="text-zinc-500 mb-8">
            Blader door alle steden en ontdek de beste wijken om te wonen.
          </p>

          {(() => {
            const groups = groupByFirstLetter(sortedCities);
            const letters = Array.from(groups.keys()).sort();
            return (
              <div className="columns-2 md:columns-4 gap-x-8">
                {letters.map((letter) => (
                  <div key={letter} className="break-inside-avoid mb-6">
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">
                      {letter}
                    </h3>
                    <ul className="space-y-1">
                      {groups.get(letter)!.map((city) => (
                        <li key={city.slug}>
                          <Link
                            href={`/${city.slug}`}
                            className="text-sm text-zinc-600 hover:text-emerald-700 hover:underline transition-colors"
                          >
                            {city.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        <p>Allesteden — Open data van CBS, PDOK, Politie en Leefbaarometer</p>
      </footer>
    </div>
  );
}
