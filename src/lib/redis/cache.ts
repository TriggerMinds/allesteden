import { getCacheRedis } from "../queue/connection";

const DEFAULT_TTL_SECONDS = 3600;

export function cacheKey(...parts: string[]): string {
  return `cache:${parts.join(":")}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getCacheRedis();
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function setCache(
  key: string,
  value: unknown,
  ttl = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const redis = getCacheRedis();
  const serialized = JSON.stringify(value);
  await redis.setex(key, ttl, serialized);
}

export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getCacheRedis();
  let cursor = "0";
  do {
    const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", "100");
    cursor = result[0];
    const keys = result[1];
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}
