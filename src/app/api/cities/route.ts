import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCache, cacheKey } from "@/lib/redis/cache";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/redis/rate-limit";
import type { CitiesApiResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const rl = await checkRateLimit(rateLimitIdentifier(request));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", status: 429 } as const,
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const cached = await getCached<CitiesApiResponse>(cacheKey("cities"));
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "X-Cache": "HIT",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  }

  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { neighborhoods: true },
      },
    },
  });

  const response: CitiesApiResponse = {
    cities: cities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      neighborhoodCount: c._count.neighborhoods,
    })),
  };

  await setCache(cacheKey("cities"), response);

  return NextResponse.json(response, {
    headers: {
      "X-Cache": "MISS",
      "X-RateLimit-Remaining": String(rl.remaining),
    },
  });
}
