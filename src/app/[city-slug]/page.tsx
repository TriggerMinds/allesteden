import type { NeighborhoodsApiResponse } from "@/lib/api/types";
import { DEMO_GEOMETRIES } from "@/lib/demo-geometry";
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
    { id: 1, cityId: 1, name: "Centrum", slug: "centrum",
      safetyScore: 6.5, theftSafetyScore: 5.8, socialSafetyScore: 7.2,
      greenScore: 4.2, quietScore: 2.1,
      geometry: DEMO_GEOMETRIES["centrum"]!, details: { aantalinwoners: 95000, inkomen: 42000 } },
    { id: 2, cityId: 1, name: "West", slug: "west",
      safetyScore: 7.1, theftSafetyScore: 6.5, socialSafetyScore: 7.7,
      greenScore: 6.8, quietScore: 5.3,
      geometry: DEMO_GEOMETRIES["west"]!, details: { aantalinwoners: 82000, inkomen: 38500 } },
    { id: 3, cityId: 1, name: "Zuid", slug: "zuid",
      safetyScore: 8.2, theftSafetyScore: 8.0, socialSafetyScore: 8.4,
      greenScore: 7.5, quietScore: 6.0,
      geometry: DEMO_GEOMETRIES["zuid"]!, details: { aantalinwoners: 78000, inkomen: 48000 } },
    { id: 4, cityId: 1, name: "Noord", slug: "noord",
      safetyScore: 7.8, theftSafetyScore: 7.5, socialSafetyScore: 8.1,
      greenScore: 8.1, quietScore: 7.2,
      geometry: DEMO_GEOMETRIES["noord"]!, details: { aantalinwoners: 65000, inkomen: 36000 } },
    { id: 5, cityId: 1, name: "Oost", slug: "oost",
      safetyScore: 7.3, theftSafetyScore: 6.8, socialSafetyScore: 7.8,
      greenScore: 7.0, quietScore: 5.8,
      geometry: DEMO_GEOMETRIES["oost"]!, details: { aantalinwoners: 71000, inkomen: 39500 } },
    { id: 6, cityId: 1, name: "Nieuw-West", slug: "nieuw-west",
      safetyScore: 6.8, theftSafetyScore: 6.0, socialSafetyScore: 7.6,
      greenScore: 6.5, quietScore: 6.1,
      geometry: DEMO_GEOMETRIES["nieuw-west"]!, details: { aantalinwoners: 56000, inkomen: 32000 } },
    { id: 7, cityId: 1, name: "Zuidoost", slug: "zuidoost",
      safetyScore: 5.2, theftSafetyScore: 4.5, socialSafetyScore: 5.9,
      greenScore: 5.8, quietScore: 5.5,
      geometry: DEMO_GEOMETRIES["zuidoost"]!, details: { aantalinwoners: 48000, inkomen: 28000 } },
    { id: 8, cityId: 1, name: "Buitenveldert", slug: "buitenveldert",
      safetyScore: 8.5, theftSafetyScore: 8.2, socialSafetyScore: 8.8,
      greenScore: 7.8, quietScore: 7.5,
      geometry: DEMO_GEOMETRIES["buitenveldert"]!, details: { aantalinwoners: 28000, inkomen: 52000 } },
    { id: 9, cityId: 1, name: "IJburg", slug: "ijburg",
      safetyScore: 7.9, theftSafetyScore: 7.6, socialSafetyScore: 8.2,
      greenScore: 8.5, quietScore: 7.8,
      geometry: DEMO_GEOMETRIES["ijburg"]!, details: { aantalinwoners: 32000, inkomen: 45000 } },
    { id: 10, cityId: 1, name: "Slotervaart", slug: "slotervaart",
      safetyScore: 6.2, theftSafetyScore: 5.5, socialSafetyScore: 6.9,
      greenScore: 6.8, quietScore: 6.5,
      geometry: DEMO_GEOMETRIES["slotervaart"]!, details: { aantalinwoners: 38000, inkomen: 31000 } },
    { id: 11, cityId: 1, name: "Bos en Lommer", slug: "bos-en-lommer",
      safetyScore: 6.5, theftSafetyScore: 5.8, socialSafetyScore: 7.2,
      greenScore: 5.5, quietScore: 5.0,
      geometry: DEMO_GEOMETRIES["bos-en-lommer"]!, details: { aantalinwoners: 42000, inkomen: 34000 } },
    { id: 12, cityId: 1, name: "De Pijp", slug: "de-pijp",
      safetyScore: 7.0, theftSafetyScore: 6.5, socialSafetyScore: 7.5,
      greenScore: 4.0, quietScore: 2.5,
      geometry: DEMO_GEOMETRIES["de-pijp"]!, details: { aantalinwoners: 45000, inkomen: 41000 } },
    { id: 13, cityId: 1, name: "Jordaan", slug: "jordaan",
      safetyScore: 7.2, theftSafetyScore: 6.8, socialSafetyScore: 7.6,
      greenScore: 3.5, quietScore: 1.8,
      geometry: DEMO_GEOMETRIES["jordaan"]!, details: { aantalinwoners: 35000, inkomen: 44000 } },
    { id: 14, cityId: 1, name: "Watergraafsmeer", slug: "watergraafsmeer",
      safetyScore: 7.6, theftSafetyScore: 7.2, socialSafetyScore: 8.0,
      greenScore: 8.2, quietScore: 7.0,
      geometry: DEMO_GEOMETRIES["watergraafsmeer"]!, details: { aantalinwoners: 30000, inkomen: 43000 } },
    { id: 15, cityId: 1, name: "Geuzenveld", slug: "geuzenveld",
      safetyScore: 6.0, theftSafetyScore: 5.2, socialSafetyScore: 6.8,
      greenScore: 6.5, quietScore: 6.2,
      geometry: DEMO_GEOMETRIES["geuzenveld"]!, details: { aantalinwoners: 25000, inkomen: 30000 } },
    { id: 16, cityId: 1, name: "Osdorp", slug: "osdorp",
      safetyScore: 5.8, theftSafetyScore: 5.0, socialSafetyScore: 6.6,
      greenScore: 7.2, quietScore: 7.0,
      geometry: DEMO_GEOMETRIES["osdorp"]!, details: { aantalinwoners: 34000, inkomen: 29000 } },
    { id: 17, cityId: 1, name: "Zeeburg", slug: "zeeburg",
      safetyScore: 7.4, theftSafetyScore: 7.0, socialSafetyScore: 7.8,
      greenScore: 7.5, quietScore: 6.5,
      geometry: DEMO_GEOMETRIES["zeeburg"]!, details: { aantalinwoners: 29000, inkomen: 38000 } },
    { id: 18, cityId: 1, name: "Bijlmer-Centrum", slug: "bijlmer-centrum",
      safetyScore: 4.5, theftSafetyScore: 3.5, socialSafetyScore: 5.5,
      greenScore: 6.0, quietScore: 5.0,
      geometry: DEMO_GEOMETRIES["bijlmer-centrum"]!, details: { aantalinwoners: 52000, inkomen: 25000 } },
    { id: 19, cityId: 1, name: "Noordelijke IJ-oevers", slug: "noordelijke-ij-oevers",
      safetyScore: 7.5, theftSafetyScore: 7.2, socialSafetyScore: 7.8,
      greenScore: 6.0, quietScore: 5.5,
      geometry: DEMO_GEOMETRIES["noordelijke-ij-oevers"]!, details: { aantalinwoners: 18000, inkomen: 47000 } },
    { id: 20, cityId: 1, name: "Station Omgeving", slug: "station-omgeving",
      safetyScore: 5.5, theftSafetyScore: 4.8, socialSafetyScore: 6.2,
      greenScore: 2.5, quietScore: 1.5,
      geometry: DEMO_GEOMETRIES["station-omgeving"]!, details: { aantalinwoners: 12000, inkomen: 40000 } },
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
