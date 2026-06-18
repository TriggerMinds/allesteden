import { getCacheRedis } from "../queue/connection";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 100,
};

export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {},
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const redis = getCacheRedis();
  const key = `ratelimit:${identifier}`;

  const now = Date.now();
  const windowStart = now - windowMs;
  const multi = redis.multi();

  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now, `${now}-${Math.random()}`);
  multi.zcard(key);
  multi.pexpire(key, windowMs);
  multi.pttl(key);

  const results = await multi.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;
  const ttl = (results?.[4]?.[1] as number) ?? windowMs;

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetMs: ttl,
  };
}

export function rateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
  return `ip:${ip}`;
}
