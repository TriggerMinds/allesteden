import { Worker, type Job } from "bullmq";
import { getBullConnection } from "../lib/queue/connection";
import { QUEUES, type PoliceDataJobData } from "../lib/queue/constants";
import { createJobLogger } from "./logger";

const POLICE_API_BASE = "https://data.politie.nl/api/v1/odata";

interface PoliceCrimeRecord {
  Jaar: number;
  WijkenEnBuurten: string;
  GeregistreerdeMisdrijven: number;
  [key: string]: unknown;
}

interface ODataResponse {
  value: PoliceCrimeRecord[];
  "@odata.nextLink"?: string;
}

async function fetchPoliceCrimeData(year: number): Promise<PoliceCrimeRecord[]> {
  const url = `${POLICE_API_BASE}/MisdrijvenWijkenBuurt?$filter=Jaar eq ${year}`;
  const allRecords: PoliceCrimeRecord[] = [];
  let nextUrl: string | undefined = url;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error(
        `Police API request failed: ${response.status} ${response.statusText}`,
      );
    }
    const data: ODataResponse = await response.json();
    allRecords.push(...data.value);
    nextUrl = data["@odata.nextLink"];
  }

  return allRecords;
}

function parseLocationCode(locationCode: string): { neighborhoodSlug?: string; cityName?: string } {
  const parts = locationCode.split(" ");
  if (parts.length >= 2) {
    return {
      neighborhoodSlug: parts[0]?.toLowerCase(),
      cityName: parts.slice(1).join(" "),
    };
  }
  return {};
}

export async function processPoliceData(job: Job<PoliceDataJobData>): Promise<{ imported: number; year: number }> {
  const log = createJobLogger(job.id ?? undefined, QUEUES.POLICE_DATA);
  const year = job.data.year ?? new Date().getFullYear() - 1;

  log.info({ year }, "Starting police crime data import");

  const records = await fetchPoliceCrimeData(year);
  log.info({ recordCount: records.length }, "Downloaded police crime records");

  const { prisma } = await import("../lib/prisma");
  let imported = 0;

  for (const record of records) {
    const { neighborhoodSlug, cityName } = parseLocationCode(record.WijkenEnBuurten);
    if (!neighborhoodSlug || !cityName) continue;

    const city = await prisma.city.findFirst({
      where: { name: { contains: cityName, mode: "insensitive" } },
    });
    if (!city) continue;

    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        cityId: city.id,
        slug: { contains: neighborhoodSlug },
      },
    });
    if (!neighborhood) continue;

    const crimeScore = Math.max(0, Math.min(10, 10 - record.GeregistreerdeMisdrijven / 100));

    await prisma.$executeRawUnsafe(
      `UPDATE neighborhoods SET safety_score = $1, details_json = jsonb_set(
        COALESCE(details_json, '{}'::jsonb),
        '{police_data}',
        $2::jsonb
      ) WHERE id = $3`,
      crimeScore,
      JSON.stringify(record),
      neighborhood.id,
    );
    imported++;
  }

  log.info({ totalImported: imported }, "Police data import completed");
  return { imported, year };
}

export function createPoliceWorker(): Worker {
  const worker = new Worker(
    QUEUES.POLICE_DATA,
    async (job) => {
      return processPoliceData(job);
    },
    {
      connection: getBullConnection(),
      concurrency: 3,
      lockDuration: 60_000,
    },
  );

  worker.on("failed", (job, err) => {
    const log = createJobLogger(job?.id ?? undefined, QUEUES.POLICE_DATA);
    log.error({ err, jobId: job?.id }, "Police worker job failed");
  });

  return worker;
}
