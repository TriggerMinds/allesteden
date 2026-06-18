import { Redis } from "ioredis";
import type { ConnectionOptions } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export function getRedisUrl(): string {
  return REDIS_URL;
}

export function getBullConnection(): ConnectionOptions {
  return { url: REDIS_URL };
}

let cacheRedis: Redis | null = null;

export function getCacheRedis(): Redis {
  if (!cacheRedis) {
    cacheRedis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      family: 4,
    });
  }
  return cacheRedis;
}

export async function closeAllRedis(): Promise<void> {
  if (cacheRedis) {
    await cacheRedis.quit();
    cacheRedis = null;
  }
}
