import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCache, cacheKey } from "@/lib/redis/cache";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/redis/rate-limit";
import type { NeighborhoodsApiResponse, GeoJsonGeometry } from "@/lib/api/types";

export const dynamic = "force-dynamic";

function parseGeometry(raw: unknown): GeoJsonGeometry | null {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null) {
    const geom = raw as Record<string, unknown>;
    if (typeof geom.type === "string" && Array.isArray(geom.coordinates)) {
      return { type: geom.type, coordinates: geom.coordinates };
    }
  }
  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
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

  const citySlug = request.nextUrl.searchParams.get("city");
  if (!citySlug) {
    return NextResponse.json(
      { error: "Missing required query parameter: city", status: 400 } as const,
      { status: 400 },
    );
  }

  const cacheKeyStr = cacheKey("neighborhoods", citySlug);
  const cached = await getCached<NeighborhoodsApiResponse>(cacheKeyStr);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "X-Cache": "HIT",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  }

  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
  });

  if (!city) {
    return NextResponse.json(
      { error: `City '${citySlug}' not found`, status: 404 } as const,
      { status: 404 },
    );
  }

  const neighborhoods = await prisma.$queryRawUnsafe<
    {
      id: number;
      city_id: number;
      name: string;
      slug: string;
      safety_score: number | null;
      theft_safety_score: number | null;
      social_safety_score: number | null;
      green_score: number | null;
      quiet_score: number | null;
      geometry: unknown;
      details_json: unknown;
    }[]
  >(
    `SELECT
      id, city_id, name, slug,
      safety_score, theft_safety_score, social_safety_score,
      green_score, quiet_score,
      ST_AsGeoJSON(geometry)::jsonb AS geometry,
      details_json
    FROM neighborhoods
    WHERE city_id = $1
    ORDER BY name ASC`,
    city.id,
  );

  const response: NeighborhoodsApiResponse = {
    city: { id: city.id, name: city.name, slug: city.slug },
    neighborhoods: neighborhoods.map((n) => ({
      id: n.id,
      cityId: n.city_id,
      name: n.name,
      slug: n.slug,
      safetyScore: n.safety_score,
      theftSafetyScore: n.theft_safety_score,
      socialSafetyScore: n.social_safety_score,
      greenScore: n.green_score,
      quietScore: n.quiet_score,
      geometry: parseGeometry(n.geometry),
      details: n.details_json as Record<string, unknown> | null,
    })),
  };

  await setCache(cacheKeyStr, response);

  return NextResponse.json(response, {
    headers: {
      "X-Cache": "MISS",
      "X-RateLimit-Remaining": String(rl.remaining),
    },
  });
}
