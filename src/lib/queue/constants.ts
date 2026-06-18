export const QUEUES = {
  CBS_DATA: "cbs-data",
  POLICE_DATA: "police-data",
  LEEFBAAROMETER_DATA: "leefbaarometer-data",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export interface CbsDataJobData {
  year?: number;
  url?: string;
}

export interface PoliceDataJobData {
  year?: number;
  region?: string;
}

export interface LeefbaarometerJobData {
  year?: number;
}

export type JobDataMap = {
  [QUEUES.CBS_DATA]: CbsDataJobData;
  [QUEUES.POLICE_DATA]: PoliceDataJobData;
  [QUEUES.LEEFBAAROMETER_DATA]: LeefbaarometerJobData;
};

export const JOB_NAMES = {
  IMPORT_CBS_GEOMETRIES: "import-cbs-geometries",
  IMPORT_POLICE_CRIME: "import-police-crime",
  IMPORT_LEEFBAAROMETER: "import-leefbaarometer",
} as const;
