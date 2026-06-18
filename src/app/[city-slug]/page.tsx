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

export default async function CityPage({ params }: CityPageProps) {
  const { "city-slug": slug } = await params;

  const data = await getCityData(slug);

  const neighborhoods = data?.neighborhoods ?? [];
  const cityName = data?.city?.name ?? slug;

  return (
    <CityContent neighborhoods={neighborhoods} cityName={cityName} />
  );
}
