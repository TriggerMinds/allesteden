import { Queue } from "bullmq";
import { getBullConnection } from "./connection";
import { QUEUES } from "./constants";

function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: getBullConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: { age: 7 * 24 * 3600, count: 100 },
      removeOnFail: { age: 30 * 24 * 3600, count: 500 },
    },
  });
}

export const cbsDataQueue = createQueue(QUEUES.CBS_DATA);
export const policeDataQueue = createQueue(QUEUES.POLICE_DATA);
export const leefbaarometerDataQueue = createQueue(QUEUES.LEEFBAAROMETER_DATA);

export const queues = [cbsDataQueue, policeDataQueue, leefbaarometerDataQueue] as const;

import { closeAllRedis } from "./connection";

export async function closeAllQueues(): Promise<void> {
  await Promise.all(queues.map((q) => q.close()));
  await closeAllRedis();
}
