import { Worker, type Job } from "bullmq";
import { getBullConnection } from "../lib/queue/connection";
import { QUEUES, type CbsDataJobData } from "../lib/queue/constants";
import { createJobLogger } from "./logger";

const CBS_OGC_URL = "https://api.pdok.nl/cbs/wijken-en-buurten-2023/ogc/v1/collections/buurten/items";

interface CbsFeature {
  type: "Feature";
  properties: {
    wijknaam?: string;
    buurtnaam?: string;
    gemeentenaam?: string;
    aantalinwoners?: number;
    grote_supermarkt_gemiddelde_afstand_in_km?: number;
    restaurant_gemiddelde_afstand_in_km?: number;
    treinstation_gemiddelde_afstand_in_km?: number;
    oprit_hoofdverkeersweg_gemiddelde_afstand_in_km?: number;
    percentage_bouwjaarklasse_tot_2000?: number;
    percentage_bouwjaarklasse_vanaf_2000?: number;
    percentage_eengezinswoning?: number;
    percentage_meergezinswoning?: number;
    percentage_huurwoningen?: number;
    percentage_koopwoningen?: number;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  } | null;
}

function determineSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calculateDistanceScore(distance: number | undefined | null, multiplier: number = 2): number | null {
  if (distance == null || distance < 0) return null;
  // Simple mapping: 0 km = 10, X km = 0
  const score = Math.max(0, 10 - distance * multiplier);
  return Math.round(score * 10) / 10;
}

async function upsertCity(cityName: string) {
  const { prisma } = await import("../lib/prisma");
  const slug = determineSlug(cityName);
  return prisma.city.upsert({
    where: { slug },
    update: { name: cityName },
    create: { name: cityName, slug },
  });
}

async function upsertNeighborhood(
  cityId: number,
  feature: CbsFeature,
  log: ReturnType<typeof createJobLogger>,
) {
  if (!feature.geometry) return;
  const { prisma } = await import("../lib/prisma");
  const props = feature.properties;
  
  const name = props.buurtnaam ?? props.wijknaam ?? "Unknown";
  const slug = `${determineSlug(name)}-${cityId}`;
  const geometryGeoJson = JSON.stringify(feature.geometry);

  // Compute our 0-10 scores
  const hospitalityScore = calculateDistanceScore(props.restaurant_gemiddelde_afstand_in_km, 2); // 5km = 0
  const dailyShoppingScore = calculateDistanceScore(props.grote_supermarkt_gemiddelde_afstand_in_km, 3); // 3.3km = 0
  
  let accessibilityScore: number | null = null;
  const trainDist = props.treinstation_gemiddelde_afstand_in_km;
  const highwayDist = props.oprit_hoofdverkeersweg_gemiddelde_afstand_in_km;
  if (trainDist != null && trainDist >= 0 && highwayDist != null && highwayDist >= 0) {
    const avgDist = (trainDist + highwayDist) / 2;
    accessibilityScore = calculateDistanceScore(avgDist, 1.5);
  }

  // Fallback leefbaarometer score from homeownership rate (always available in CBS data)
  let leefbaarometerScore: number | null = null;
  if (props.percentage_koopwoningen != null) {
    leefbaarometerScore = Math.round((props.percentage_koopwoningen / 10) * 10) / 10;
  }

  // Green score: average of park + forest distance (inverted: closer = higher)
  let greenScore: number | null = null;
  const parkDist = props.afstand_tot_park_of_plantsoen as number | undefined;
  const forestDist = props.afstand_tot_bos as number | undefined;
  if (parkDist != null || forestDist != null) {
    const distances = [parkDist, forestDist].filter((d): d is number => d != null && d >= 0);
    if (distances.length > 0) {
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      greenScore = Math.round(Math.max(0, 10 - avgDist * 2) * 10) / 10;
    }
  }

  // Quiet score: from urban density (inverted: fewer addresses/km2 = quieter)
  let quietScore: number | null = null;
  const density = props.stedelijkheid_adressen_per_km2 as number | undefined;
  if (density != null) {
    quietScore = Math.round(Math.max(0, 10 - density / 2500) * 10) / 10;
  }

  // Safety proxy score: from income + employment + education
  let safetyScore: number | null = null;
  const lowIncome = props.percentage_huishoudens_met_laag_inkomen as number | undefined;
  const unemployed = props.percentage_werknemers_met_flexibele_arbeidsrelatie as number | undefined;
  const highEdu = props.opleidingsniveau_hoog as number | undefined;
  if (lowIncome != null || unemployed != null || highEdu != null) {
    const riskFactors: number[] = [];
    if (lowIncome != null) riskFactors.push(lowIncome);
    if (unemployed != null) riskFactors.push(unemployed);
    const avgRisk = riskFactors.length > 0
      ? riskFactors.reduce((a, b) => a + b, 0) / riskFactors.length
      : 50;
    const eduBoost = highEdu != null ? highEdu / 5 : 0;
    safetyScore = Math.round(Math.min(10, Math.max(0, 10 - avgRisk / 10 + eduBoost)) * 10) / 10;
  }

  const demographicData = {
    inwoners: props.aantalinwoners,
    bouwjaar: {
      tot_2000: props.percentage_bouwjaarklasse_tot_2000,
      vanaf_2000: props.percentage_bouwjaarklasse_vanaf_2000,
    },
    woningtype: {
      eengezinswoning: props.percentage_eengezinswoning,
      meergezinswoning: props.percentage_meergezinswoning,
      huur: props.percentage_huurwoningen,
      koop: props.percentage_koopwoningen,
    },
    ...props
  };

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO neighborhoods (
         city_id, name, slug, geometry, details_json, 
         hospitality_score, daily_shopping_score, accessibility_score,
         leefbaarometer_score, green_score, quiet_score, safety_score
       )
       VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (city_id, slug)
       DO UPDATE SET
         name = EXCLUDED.name,
         geometry = EXCLUDED.geometry,
         details_json = EXCLUDED.details_json,
         hospitality_score = EXCLUDED.hospitality_score,
         daily_shopping_score = EXCLUDED.daily_shopping_score,
         accessibility_score = EXCLUDED.accessibility_score,
         leefbaarometer_score = COALESCE(EXCLUDED.leefbaarometer_score, neighborhoods.leefbaarometer_score),
         green_score = COALESCE(EXCLUDED.green_score, neighborhoods.green_score),
         quiet_score = COALESCE(EXCLUDED.quiet_score, neighborhoods.quiet_score),
         safety_score = COALESCE(EXCLUDED.safety_score, neighborhoods.safety_score)`,
      cityId,
      name,
      slug,
      geometryGeoJson,
      JSON.stringify(demographicData),
      hospitalityScore,
      dailyShoppingScore,
      accessibilityScore,
      leefbaarometerScore,
      greenScore,
      quietScore,
      safetyScore
    );
  } catch (err) {
    log.warn({ err, featureName: name }, "Failed to upsert neighborhood geometry");
  }
}

export async function processCbsData(job: Job<CbsDataJobData>): Promise<{ imported: number; cities: Set<string> }> {
  const log = createJobLogger(job.id ?? undefined, QUEUES.CBS_DATA);
  const bbox = job.data.bbox;

  const url = bbox ? `${CBS_OGC_URL}?bbox=${bbox}` : CBS_OGC_URL;
  log.info({ url, bbox: bbox ?? "none" }, "Starting CBS geometry import");

  const res = await fetch(url, {
    headers: { Accept: "application/geo+json" },
  });
  if (!res.ok) {
    log.error({ status: res.status }, "CBS OGC API failed");
    return { imported: 0, cities: new Set<string>() };
  }

  const data: { type: string; features: CbsFeature[] } = await res.json();
  const features = data.features;
  let imported = 0;
  const cities = new Set<string>();

  log.info({ featureCount: features.length }, "Received CBS features");

  for (const feature of features) {
    const cityName = feature.properties.gemeentenaam;
    if (!cityName) continue;

    cities.add(cityName);
    const city = await upsertCity(cityName);
    await upsertNeighborhood(city.id, feature, log);
    imported++;
  }

  log.info({ totalImported: imported, totalCities: cities.size }, "CBS import completed");
  return { imported, cities };
}

export function createCbsWorker(): Worker {
  const worker = new Worker(
    QUEUES.CBS_DATA,
    async (job) => {
      return processCbsData(job);
    },
    {
      connection: getBullConnection(),
      concurrency: 1,
      lockDuration: 300_000,
    },
  );

  worker.on("failed", (job, err) => {
    const log = createJobLogger(job?.id ?? undefined, QUEUES.CBS_DATA);
    log.error({ err, jobId: job?.id }, "CBS worker job failed");
  });

  return worker;
}
