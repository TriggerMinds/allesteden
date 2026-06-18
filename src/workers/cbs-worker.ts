import { Worker, type Job } from "bullmq";
import { getBullConnection } from "../lib/queue/connection";
import { QUEUES, type CbsDataJobData } from "../lib/queue/constants";
import { createJobLogger } from "./logger";

const CBS_PDOK_URL =
  "https://service.pdok.nl/cbs/wijken-buurten/2024/atom/downloads/wijken_buurten_2024.geojson";

interface CbsFeature {
  type: "Feature";
  properties: {
    wijknaam?: string;
    buurtnaam?: string;
    gemeentenaam?: string;
    wijkoppervlakte_ha?: number;
    wateroppervlakte_ha?: number;
    aantalinwoners?: number;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

async function downloadCbsData(url: string): Promise<{ type: string; features: CbsFeature[] }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CBS PDOK download failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function determineSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function upsertCity(
  cityName: string,
) {
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
  const { prisma } = await import("../lib/prisma");
  const props = feature.properties;
  const name = props.buurtnaam ?? props.wijknaam ?? "Unknown";
  const slug = `${determineSlug(name)}-${cityId}`;
  const geometryGeoJson = JSON.stringify(feature.geometry);

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO neighborhoods (city_id, name, slug, geometry, details_json)
       VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5::jsonb)
       ON CONFLICT (city_id, slug)
       DO UPDATE SET
         name = EXCLUDED.name,
         geometry = EXCLUDED.geometry,
         details_json = EXCLUDED.details_json`,
      cityId,
      name,
      slug,
      geometryGeoJson,
      JSON.stringify(props),
    );
  } catch (err) {
    log.warn({ err, featureName: name }, "Failed to upsert neighborhood geometry");
  }
}

export async function processCbsData(job: Job<CbsDataJobData>): Promise<{ imported: number; cities: Set<string> }> {
  const log = createJobLogger(job.id ?? undefined, QUEUES.CBS_DATA);
  const url = job.data.url ?? CBS_PDOK_URL;

  log.info({ url }, "Starting CBS geometry import");

  const geoJson = await downloadCbsData(url);
  log.info({ featureCount: geoJson.features.length }, "Downloaded CBS GeoJSON data");

  const cities = new Set<string>();
  let imported = 0;

  for (const feature of geoJson.features) {
    const cityName = feature.properties.gemeentenaam;
    if (!cityName) continue;
    cities.add(cityName);
  }

  for (const cityName of cities) {
    try {
      const city = await upsertCity(cityName);
      const cityFeatures = geoJson.features.filter(
        (f) => f.properties.gemeentenaam === cityName,
      );
      for (const feature of cityFeatures) {
        await upsertNeighborhood(city.id, feature, log);
        imported++;
      }
      log.info({ city: cityName, neighborhoods: cityFeatures.length }, "Imported city neighborhoods");
    } catch (err) {
      log.error({ err, city: cityName }, "Failed to import city");
    }
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
      concurrency: 2,
      lockDuration: 120_000,
    },
  );

  worker.on("failed", (job, err) => {
    const log = createJobLogger(job?.id ?? undefined, QUEUES.CBS_DATA);
    log.error({ err, jobId: job?.id }, "CBS worker job failed");
  });

  return worker;
}
