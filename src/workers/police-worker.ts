import { Worker, type Job } from "bullmq";
import { getBullConnection } from "../lib/queue/connection";
import { QUEUES, type PoliceDataJobData } from "../lib/queue/constants";
import { createJobLogger } from "./logger";

const CBS_ODATA_BASE = "https://dataderden.cbs.nl/ODataFeed/OData/47018NED/TypedDataSet";

// We extract data for 2023 for now, as 2024 data might not be fully available yet for all months in the yearly dataset.
const DEFAULT_YEAR = "2023JJ00";

const THEFT_CODES = [
  "1.1.1 ", "1.1.2 ", "1.2.1 ", "1.2.2 ", "1.2.3 ", 
  "1.2.4 ", "1.2.5 ", "1.6.2 ", "2.5.1 ", "2.5.2 "
];

const SOCIAL_CODES = [
  "1.4.1 ", "1.4.2 ", "1.4.3 ", "1.4.4 ", "1.4.5 ", 
  "1.4.6 ", "1.4.7 ", "2.1.1 ", "2.2.1 ", "3.6.4 "
];

interface CbsCrimeRecord {
  ID: number;
  SoortMisdrijf: string;
  WijkenEnBuurten: string;
  Perioden: string;
  GeregistreerdeMisdrijven_1: number;
}

interface ODataResponse {
  value: CbsCrimeRecord[];
  "@odata.nextLink"?: string;
}

async function fetchCrimeData(log: ReturnType<typeof createJobLogger>): Promise<Map<string, { theft: number; social: number }>> {
  // Build a filter to get only the relevant crimes for buurten in the specified year.
  // Example filter: startswith(WijkenEnBuurten, 'BU') and Perioden eq '2023JJ00' and (SoortMisdrijf eq '1.1.1 ' or ...)
  
  const targetCodes = [...THEFT_CODES, ...SOCIAL_CODES];
  const soortMisdrijfFilters = targetCodes.map((code) => `SoortMisdrijf eq '${code}'`).join(" or ");
  
  const filter = `startswith(WijkenEnBuurten, 'BU') and Perioden eq '${DEFAULT_YEAR}' and (${soortMisdrijfFilters})`;
  let nextUrl: string | undefined = `${CBS_ODATA_BASE}?$filter=${encodeURIComponent(filter)}&$format=json`;
  
  const aggregatedData = new Map<string, { theft: number; social: number }>();

  let recordsFetched = 0;
  while (nextUrl) {
    log.info({ nextUrl: nextUrl.split("?")[0] }, "Fetching crime batch");
    const response = await fetch(nextUrl);
    
    if (!response.ok) {
      throw new Error(`CBS OData request failed: ${response.status} ${response.statusText}`);
    }
    
    const data: ODataResponse = await response.json();
    
    for (const record of data.value) {
      const count = record.GeregistreerdeMisdrijven_1 ?? 0;
      if (count === 0) continue;

      const buurtCode = record.WijkenEnBuurten.trim();
      
      let stats = aggregatedData.get(buurtCode);
      if (!stats) {
        stats = { theft: 0, social: 0 };
        aggregatedData.set(buurtCode, stats);
      }

      if (THEFT_CODES.includes(record.SoortMisdrijf)) {
        stats.theft += count;
      } else if (SOCIAL_CODES.includes(record.SoortMisdrijf)) {
        stats.social += count;
      }
    }
    
    recordsFetched += data.value.length;
    nextUrl = data["@odata.nextLink"];
  }

  log.info({ recordsFetched, buurtenCount: aggregatedData.size }, "Completed fetching and aggregating crime data");
  return aggregatedData;
}

export async function processPoliceData(job: Job<PoliceDataJobData>): Promise<{ imported: number }> {
  const log = createJobLogger(job.id ?? undefined, QUEUES.POLICE_DATA);

  log.info("Starting police crime data import from CBS dataset 47018NED");

  const crimeData = await fetchCrimeData(log);

  const { prisma } = await import("../lib/prisma");
  let updatedCount = 0;

  // We fetch all neighborhoods to process them in batches or sequentially.
  const neighborhoods = await prisma.neighborhood.findMany({
    select: { id: true, detailsJson: true }
  });

  for (const neighborhood of neighborhoods) {
    const details = neighborhood.detailsJson as Record<string, unknown>;
    if (!details) continue;

    // CBS worker saves 'buurtcode' in detailsJson
    const buurtcode = details.buurtcode as string | undefined;
    if (!buurtcode) continue;

    const stats = crimeData.get(buurtcode);
    if (!stats) continue;

    const inwonersRaw = details.aantalinwoners ?? details.inwoners;
    const inwoners = typeof inwonersRaw === "number" ? inwonersRaw : 0;
    
    let theftScore: number | null = null;
    let socialScore: number | null = null;

    if (inwoners > 0) {
      // Rates per 1000 residents
      const theftRate = (stats.theft / inwoners) * 1000;
      const socialRate = (stats.social / inwoners) * 1000;

      // Map rates to 0-10 score. 
      // Example calibration: 30 thefts/1000 -> 0, 0 thefts -> 10.
      // Example calibration: 15 social crimes/1000 -> 0, 0 social crimes -> 10.
      theftScore = Math.round(Math.max(0, 10 - (theftRate / 3)) * 10) / 10;
      socialScore = Math.round(Math.max(0, 10 - (socialRate / 1.5)) * 10) / 10;
    }

    // Save the raw crime counts in details_json as well for later use
    const newDetails = {
      ...details,
      police_data: {
        year: DEFAULT_YEAR.replace("JJ00", ""),
        theftCrimes: stats.theft,
        socialCrimes: stats.social
      }
    };

    await prisma.neighborhood.update({
      where: { id: neighborhood.id },
      data: {
        theftSafetyScore: theftScore,
        socialSafetyScore: socialScore,
        detailsJson: newDetails
      }
    });

    updatedCount++;
  }

  log.info({ updatedCount }, "Police data import completed");
  return { imported: updatedCount };
}

export function createPoliceWorker(): Worker {
  const worker = new Worker(
    QUEUES.POLICE_DATA,
    async (job) => {
      return processPoliceData(job);
    },
    {
      connection: getBullConnection(),
      concurrency: 2,
      lockDuration: 60_000 * 5, // 5 minutes lock
    },
  );

  worker.on("failed", (job, err) => {
    const log = createJobLogger(job?.id ?? undefined, QUEUES.POLICE_DATA);
    log.error({ err, jobId: job?.id }, "Police worker job failed");
  });

  return worker;
}
