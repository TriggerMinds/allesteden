import "dotenv/config";
import { createCbsWorker } from "./cbs-worker";
import { createPoliceWorker } from "./police-worker";
import { createLeefbaarometerWorker } from "./leefbaarometer-worker";
import { createJobLogger } from "./logger";

const log = createJobLogger();

export function startAllWorkers() {
  const cbsWorker = createCbsWorker();
  const policeWorker = createPoliceWorker();
  const leefbaarometerWorker = createLeefbaarometerWorker();

  log.info("All ETL workers started");

  return { cbsWorker, policeWorker, leefbaarometerWorker };
}

export async function stopAllWorkers(workers: {
  cbsWorker: ReturnType<typeof createCbsWorker>;
  policeWorker: ReturnType<typeof createPoliceWorker>;
  leefbaarometerWorker: ReturnType<typeof createLeefbaarometerWorker>;
}): Promise<void> {
  await Promise.all([
    workers.cbsWorker.close(),
    workers.policeWorker.close(),
    workers.leefbaarometerWorker.close(),
  ]);
  log.info("All ETL workers stopped");
}

if (require.main === module) {
  const workers = startAllWorkers();

  process.on("SIGINT", async () => {
    log.info("Shutting down workers...");
    await stopAllWorkers(workers);
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log.info("Shutting down workers...");
    await stopAllWorkers(workers);
    process.exit(0);
  });

  log.info("Worker process ready. Waiting for jobs...");
}
