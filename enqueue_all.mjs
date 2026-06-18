import "dotenv/config";
import { cbsDataQueue } from "./src/lib/queue/index";

// Netherlands bounding box: ~3.3°E to ~7.2°E, ~50.7°N to ~53.5°N
const WEST = 3.3;
const EAST = 7.2;
const SOUTH = 50.7;
const NORTH = 53.5;
const COLS = 12;
const ROWS = 10;

const cellW = (EAST - WEST) / COLS;
const cellH = (NORTH - SOUTH) / ROWS;

async function main() {
  const jobs = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const bbox = [
        (WEST + c * cellW).toFixed(4),
        (SOUTH + r * cellH).toFixed(4),
        (WEST + (c + 1) * cellW).toFixed(4),
        (SOUTH + (r + 1) * cellH).toFixed(4),
      ].join(",");
      jobs.push({ name: "import-cbs-geometries", data: { bbox } });
    }
  }

  console.log(`Enqueuing ${jobs.length} CBS jobs...`);
  for (let i = 0; i < jobs.length; i++) {
    await cbsDataQueue.add(jobs[i].name, jobs[i].data);
    console.log(`  [${i + 1}/${jobs.length}] bbox=${jobs[i].data.bbox}`);
    await new Promise(r => setTimeout(r, 500));
  }

  const counts = await cbsDataQueue.getJobCounts();
  console.log("Queue:", JSON.stringify(counts));
  await cbsDataQueue.close();
  process.exit(0);
}

main().catch(console.error);
