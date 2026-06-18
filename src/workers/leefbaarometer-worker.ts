import { Worker, type Job } from "bullmq";
import { getBullConnection } from "../lib/queue/connection";
import { QUEUES, type LeefbaarometerJobData } from "../lib/queue/constants";
import { createJobLogger } from "./logger";

const LEEFBAAROMETER_API = "https://api.leefbaarometer.nl/v1/gebieden";
const KNMI_CLIMATE_API =
  "https://www.knmi.nl/kennis-en-datacentrum/achtergrond/klimaatdashboard";

interface LeefbaarometerRecord {
  gebiedCode: string;
  gebiedNaam: string;
  leefbaarheidsscore: number;
  veiligheidsscore: number;
  voorzieningenscore: number;
  [key: string]: unknown;
}

interface ClimateRecord {
  neighborhoodCode: string;
  hitteStress?: number;
  groenIndex?: number;
  geluidsbelasting?: number;
  [key: string]: unknown;
}

async function fetchLeefbaarometerData(year: number, log: ReturnType<typeof createJobLogger>): Promise<LeefbaarometerRecord[]> {
  try {
    const url = `${LEEFBAAROMETER_API}?jaar=${year}&format=json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      log.warn({ status: response.status }, "Leefbaarometer API returned non-200, using fallback data");
      return [];
    }

    const data = await response.json();
    return data.gebieden ?? [];
  } catch (err) {
    log.warn({ err }, "Leefbaarometer API unavailable, returning empty set");
    return [];
  }
}

async function fetchClimateData(): Promise<ClimateRecord[]> {
  try {
    const url = `${KNMI_CLIMATE_API}/wijken.json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.wijken ?? [];
  } catch {
    return [];
  }
}

function scoreFromValue(value: number | undefined | null, max: number, invert = false): number | null {
  if (value == null) return null;
  const clamped = Math.max(0, Math.min(max, value));
  const score = invert ? 10 - (clamped / max) * 10 : (clamped / max) * 10;
  return Math.round(score * 10) / 10;
}

export async function processLeefbaarometerData(
  job: Job<LeefbaarometerJobData>,
): Promise<{
  leefbaarometerImported: number;
  climateImported: number;
  year: number;
}> {
  const log = createJobLogger(job.id ?? undefined, QUEUES.LEEFBAAROMETER_DATA);
  const year = job.data.year ?? new Date().getFullYear() - 2;

  log.info({ year }, "Starting leefbaarometer & climate data import");

  const [leefbaarometerRecords, climateRecords] = await Promise.all([
    fetchLeefbaarometerData(year, log),
    fetchClimateData(),
  ]);

  log.info(
    { leefbaarometerCount: leefbaarometerRecords.length, climateCount: climateRecords.length },
    "Downloaded records",
  );

  const { prisma } = await import("../lib/prisma");
  let leefbaarometerImported = 0;
  let climateImported = 0;

  const neighborhoods = await prisma.neighborhood.findMany({
    select: { id: true, slug: true, name: true, cityId: true },
  });

  for (const record of leefbaarometerRecords) {
    const match = neighborhoods.find(
      (n) =>
        n.slug.includes(record.gebiedCode.toLowerCase()) ||
        record.gebiedNaam?.toLowerCase().includes(n.name.toLowerCase()),
    );
    if (!match) continue;

    const quietScore = record.veiligheidsscore != null
      ? scoreFromValue(100 - record.veiligheidsscore, 100, false)
      : null;

    await prisma.$executeRawUnsafe(
      `UPDATE neighborhoods SET
        quiet_score = COALESCE($1, quiet_score),
        details_json = jsonb_set(
          COALESCE(details_json, '{}'::jsonb),
          '{leefbaarometer}',
          $2::jsonb
        )
      WHERE id = $3`,
      quietScore,
      JSON.stringify(record),
      match.id,
    );
    leefbaarometerImported++;
  }

  for (const record of climateRecords) {
    const match = neighborhoods.find((n) =>
      n.slug.includes(record.neighborhoodCode?.toLowerCase() ?? ""),
    );
    if (!match) continue;

    const greenScore = scoreFromValue(record.groenIndex, 100, false);
    const quietScoreFromNoise = record.geluidsbelasting != null
      ? scoreFromValue(record.geluidsbelasting, 80, true)
      : null;

    await prisma.$executeRawUnsafe(
      `UPDATE neighborhoods SET
        green_score = COALESCE($1, green_score),
        quiet_score = COALESCE(
          CASE WHEN $2 IS NOT NULL THEN $2 ELSE quiet_score END,
          quiet_score
        ),
        details_json = jsonb_set(
          COALESCE(details_json, '{}'::jsonb),
          '{climate}',
          COALESCE(details_json -> 'climate', '{}'::jsonb) || $3::jsonb
        )
      WHERE id = $4`,
      greenScore,
      quietScoreFromNoise,
      JSON.stringify(record),
      match.id,
    );
    climateImported++;
  }

  log.info(
    { leefbaarometerImported, climateImported },
    "Leefbaarometer & climate import completed",
  );
  return { leefbaarometerImported, climateImported, year };
}

export function createLeefbaarometerWorker(): Worker {
  const worker = new Worker(
    QUEUES.LEEFBAAROMETER_DATA,
    async (job) => {
      return processLeefbaarometerData(job);
    },
    {
      connection: getBullConnection(),
      concurrency: 2,
      lockDuration: 90_000,
    },
  );

  worker.on("failed", (job, err) => {
    const log = createJobLogger(job?.id ?? undefined, QUEUES.LEEFBAAROMETER_DATA);
    log.error({ err, jobId: job?.id }, "Leefbaarometer worker job failed");
  });

  return worker;
}
