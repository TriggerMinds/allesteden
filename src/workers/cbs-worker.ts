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

function isValidCbsValue(value: number | undefined | null): value is number {
  return value != null && value >= 0 && value < 99900;
}

function calculateDistanceScore(distance: number | undefined | null, multiplier: number = 2): number | null {
  if (distance == null || distance < 0 || distance >= 99900) return null;
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

  function cbsNum(v: unknown): number | undefined {
    if (typeof v === "number" && isValidCbsValue(v)) return v;
    return undefined;
  }

  const hospitalityScore = calculateDistanceScore(cbsNum(props.restaurant_gemiddelde_afstand_in_km), 2);
  const dailyShoppingScore = calculateDistanceScore(cbsNum(props.grote_supermarkt_gemiddelde_afstand_in_km), 3);

  let accessibilityScore: number | null = null;
  const trainDist = cbsNum(props.treinstation_gemiddelde_afstand_in_km);
  const highwayDist = cbsNum(props.oprit_hoofdverkeersweg_gemiddelde_afstand_in_km);
  if (trainDist != null && highwayDist != null) {
    accessibilityScore = calculateDistanceScore((trainDist + highwayDist) / 2, 1.5);
  }

  let leefbaarometerScore: number | null = null;
  const koopPct = cbsNum(props.percentage_koopwoningen);
  if (koopPct != null) leefbaarometerScore = Math.round(koopPct / 10 * 10) / 10;

  let greenScore: number | null = null;
  const parkDist = cbsNum(props.afstand_tot_park_of_plantsoen);
  const forestDist = cbsNum(props.afstand_tot_bos);
  const natureDist = cbsNum(props.afstand_tot_open_natuur_terrein_totaal);
  const dists = [parkDist, forestDist, natureDist].filter((d): d is number => d != null);
  if (dists.length > 0) {
    greenScore = Math.round(Math.max(0, 10 - dists.reduce((a, b) => a + b, 0) / dists.length * 2) * 10) / 10;
  }

  let quietScore: number | null = null;
  const density = cbsNum(props.stedelijkheid_adressen_per_km2);
  if (density != null) quietScore = Math.round(Math.max(0, 10 - density / 2500) * 10) / 10;

  let safetyScore: number | null = null;
  const lowIncome = cbsNum(props.percentage_huishoudens_met_laag_inkomen);
  const flexWork = cbsNum(props.percentage_werknemers_met_flexibele_arbeidsrelatie);
  const highEdu = cbsNum(props.opleidingsniveau_hoog);
  const highInc = cbsNum(props.percentage_personen_met_hoog_inkomen);
  const risks = [lowIncome, flexWork].filter((r): r is number => r != null);
  if (risks.length > 0) {
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    const eduBoost = highEdu != null ? highEdu / 10 : 0;
    const incBoost = highInc != null ? highInc / 10 : 0;
    safetyScore = Math.round(Math.min(10, Math.max(0, 10 - avgRisk / 12 + eduBoost + incBoost)) * 10) / 10;
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
