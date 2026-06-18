import "dotenv/config";
import { cbsDataQueue } from "./src/lib/queue/index";

// Ultra-fijn grid rond Amsterdam (4.75-5.05°E, 52.25-52.45°N)
// 0.02° per tile = ~1.5km — elke tile bevat max ~2-10 buurten
const WEST = 4.75;
const EAST = 5.05;
const SOUTH = 52.25;
const NORTH = 52.45;
const STEP = 0.02;

async function main() {
  const tiles = [];
  for (let lng = WEST; lng < EAST; lng += STEP) {
    for (let lat = SOUTH; lat < NORTH; lat += STEP) {
      tiles.push([
        lng.toFixed(4), lat.toFixed(4),
        (lng + STEP).toFixed(4), (lat + STEP).toFixed(4),
      ].join(","));
    }
  }

  console.log(`Enqueuing ${tiles.length} fine-grid Amsterdam tiles...`);
  for (let i = 0; i < tiles.length; i++) {
    await cbsDataQueue.add("import-cbs-geometries", { bbox: tiles[i] });
    if ((i + 1) % 20 === 0) console.log(`  [${i + 1}/${tiles.length}]`);
    await new Promise((r) => setTimeout(r, 200));
  }

  const counts = await cbsDataQueue.getJobCounts();
  console.log("Queue:", JSON.stringify(counts));
  await cbsDataQueue.close();
  process.exit(0);
}

main().catch(console.error);
