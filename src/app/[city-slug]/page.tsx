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
      id: 1, cityId: 1, name: "Centrum", slug: "centrum",
      safetyScore: 6.5, theftSafetyScore: 5.8, socialSafetyScore: 7.2,
      greenScore: 4.2, quietScore: 2.1,
      geometry: null, details: { aantalinwoners: 95000, inkomen: 42000 },
    },
    {
      id: 2, cityId: 1, name: "West", slug: "west",
      safetyScore: 7.1, theftSafetyScore: 6.5, socialSafetyScore: 7.7,
      greenScore: 6.8, quietScore: 5.3,
      geometry: null, details: { aantalinwoners: 82000, inkomen: 38500 },
    },
    {
      id: 3, cityId: 1, name: "Zuid", slug: "zuid",
      safetyScore: 8.2, theftSafetyScore: 8.0, socialSafetyScore: 8.4,
      greenScore: 7.5, quietScore: 6.0,
      geometry: null, details: { aantalinwoners: 78000, inkomen: 48000 },
    },
    {
      id: 4, cityId: 1, name: "Noord", slug: "noord",
      safetyScore: 7.8, theftSafetyScore: 7.5, socialSafetyScore: 8.1,
      greenScore: 8.1, quietScore: 7.2,
      geometry: null, details: { aantalinwoners: 65000, inkomen: 36000 },
    },
    {
      id: 5, cityId: 1, name: "Oost", slug: "oost",
      safetyScore: 7.3, theftSafetyScore: 6.8, socialSafetyScore: 7.8,
      greenScore: 7.0, quietScore: 5.8,
      geometry: null, details: { aantalinwoners: 71000, inkomen: 39500 },
    },
    {
      id: 6, cityId: 1, name: "Nieuw-West", slug: "nieuw-west",
      safetyScore: 6.8, theftSafetyScore: 6.0, socialSafetyScore: 7.6,
      greenScore: 6.5, quietScore: 6.1,
      geometry: null, details: { aantalinwoners: 56000, inkomen: 32000 },
    },
    {
      id: 7, cityId: 1, name: "Zuidoost", slug: "zuidoost",
      safetyScore: 5.2, theftSafetyScore: 4.5, socialSafetyScore: 5.9,
      greenScore: 5.8, quietScore: 5.5,
      geometry: null, details: { aantalinwoners: 48000, inkomen: 28000 },
    },
  ],
};

export default async function CityPage({ params }: CityPageProps) {
  const { "city-slug": slug } = await params;

  let data = await getCityData(slug);
  if (data === null) data = DEMO_NEIGHBORHOODS;

  const { city, neighborhoods } = data;

  return (
    <CityContent neighborhoods={neighborhoods} cityName={city.name} />
  );
}
