import {
  cbsDataQueue,
  policeDataQueue,
  leefbaarometerDataQueue,
} from "./index";
import { JOB_NAMES } from "./constants";

export async function addCbsImportJob(data: { year?: number; url?: string } = {}): Promise<void> {
  await cbsDataQueue.add(JOB_NAMES.IMPORT_CBS_GEOMETRIES, data);
}

export async function addPoliceImportJob(data: { year?: number; region?: string } = {}): Promise<void> {
  await policeDataQueue.add(JOB_NAMES.IMPORT_POLICE_CRIME, data);
}

export async function addLeefbaarometerImportJob(data: { year?: number } = {}): Promise<void> {
  await leefbaarometerDataQueue.add(JOB_NAMES.IMPORT_LEEFBAAROMETER, data);
}
