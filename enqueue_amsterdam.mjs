import "dotenv/config";
import { cbsDataQueue } from "./src/lib/queue/index";

// Amsterdam bounding box: ~4.80°E to ~5.00°E, ~52.30°N to ~52.45°N
// Create micro-tiles with overlap to capture more buurten per run
const CENTER_LAT = 52.37;
const CENTER_LNG = 4.89;
const RADIUS = 0.12; // degrees
const SHIFTS = [
  [0, 0],
  [-0.04, -0.04], [+0.04, -0.04], [-0.04, +0.04], [+0.04, +0.04],
  [-0.08, 0], [+0.08, 0], [0, -0.08], [0, +0.08],
  [-0.08, -0.08], [+0.08, -0.08], [-0.08, +0.08], [+0.08, +0.08],
  [-0.12, -0.04], [+0.12, -0.04], [-0.12, +0.04], [+0.12, +0.04],
  [-0.04, -0.12], [+0.04, -0.12], [-0.04, +0.12], [+0.04, +0.12],
];

async function main() {
  console.log(`Enqueuing ${SHIFTS.length} Amsterdam micro-tiles...`);
  for (let i = 0; i < SHIFTS.length; i++) {
    const [dlng, dlat] = SHIFTS[i];
    const west = (CENTER_LNG - RADIUS + dlng).toFixed(4);
    const south = (CENTER_LAT - RADIUS + dlat).toFixed(4);
    const east = (CENTER_LNG + RADIUS + dlng).toFixed(4);
    const north = (CENTER_LAT + RADIUS + dlat).toFixed(4);
    const bbox = `${west},${south},${east},${north}`;
    await cbsDataQueue.add("import-cbs-geometries", { bbox });
    console.log(`  [${i + 1}/${SHIFTS.length}] bbox=${bbox}`);
    await new Promise((r) => setTimeout(r, 300));
  }
  const counts = await cbsDataQueue.getJobCounts();
  console.log("Queue:", JSON.stringify(counts));
  await cbsDataQueue.close();
  process.exit(0);
}

main().catch(console.error);
