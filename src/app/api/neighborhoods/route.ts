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

function computeCoreScore(n: {
  theft_safety_score?: number | null;
  social_safety_score?: number | null;
  green_score?: number | null;
  quiet_score?: number | null;
  safety_score?: number | null;
  leefbaarometer_score?: number | null;
  accessibility_score?: number | null;
  hospitality_score?: number | null;
  daily_shopping_score?: number | null;
}): number {
  const dimensions: number[] = [];

  // 1. Crime dimension (theft + social, equally weighted)
  const crimeScores = [n.theft_safety_score, n.social_safety_score].filter((s): s is number => s !== null);
  if (crimeScores.length >= 1) {
    dimensions.push(crimeScores.reduce((a, b) => a + b, 0) / crimeScores.length);
  }

  // 2. Quiet dimension (urban density)
  if (n.quiet_score != null) dimensions.push(n.quiet_score);

  // 3. Safety proxy dimension (income/employment)
  if (n.safety_score != null) dimensions.push(n.safety_score);

  // 4. Leefbaarometer dimension (homeownership)
  if (n.leefbaarometer_score != null) dimensions.push(n.leefbaarometer_score);

  // 5. Green dimension (park/forest proximity)
  if (n.green_score != null) dimensions.push(n.green_score);

  // 6. CBS facilities dimension (accessibility, hospitality, daily shopping)
  const cbsScores = [n.accessibility_score, n.hospitality_score, n.daily_shopping_score].filter((s): s is number => s !== null);
  if (cbsScores.length >= 1) {
    dimensions.push(cbsScores.reduce((a, b) => a + b, 0) / cbsScores.length);
  }

  if (dimensions.length >= 1) {
    const avg = dimensions.reduce((a, b) => a + b, 0) / dimensions.length;
    return Math.round(Math.min(9.5, avg) * 10) / 10;
  }

  return 5;
}

function computeCategory(score: number | null): string {
  if (score === null) return "Onbekend";
  if (score >= 8) return "Hoogste";
  if (score >= 7) return "Zeer hoog";
  if (score >= 6) return "Boven gemiddeld";
  if (score >= 4) return "Onder gemiddeld";
  return "Laagste";
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

  const rows = await prisma.$queryRawUnsafe<
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
      leefbaarometer_score: number | null;
      accessibility_score: number | null;
      hospitality_score: number | null;
      daily_shopping_score: number | null;
      geometry: unknown;
      details_json: Record<string, unknown> | null;
    }[]
  >(
    `SELECT
      id, city_id, name, slug,
      safety_score, theft_safety_score, social_safety_score,
      green_score, quiet_score, leefbaarometer_score,
      accessibility_score, hospitality_score, daily_shopping_score,
      ST_AsGeoJSON(geometry)::jsonb AS geometry,
      details_json
    FROM neighborhoods
    WHERE city_id = $1
    ORDER BY name ASC`,
    city.id,
  );

  const withScore = rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    buurtnaam: row.name,
    slug: row.slug,
    theftSafetyScore: row.theft_safety_score,
    socialSafetyScore: row.social_safety_score,
    greenScore: row.green_score,
    quietScore: row.quiet_score,
    safetyScore: row.safety_score,
    details: row.details_json,
    geometry: parseGeometry(row.geometry),
    wijknaam:
      (row.details_json?.wijknaam as string | undefined) ??
      row.name,
    population:
      (row.details_json?.aantalinwoners as number | undefined) ??
      (row.details_json?.population as number | undefined) ??
      null,
    score: computeCoreScore(row),
  }));

  withScore.sort((a, b) => b.score - a.score);

  const neighborhoods = withScore.map((n, i) => ({
    id: n.id,
    cityId: n.cityId,
    rank: i + 1,
    wijknaam: n.wijknaam,
    buurtnaam: n.buurtnaam,
    score: n.score,
    population: n.population,
    category: computeCategory(n.score),
    geometry: n.geometry,
    details: n.details,
  }));

  const response: NeighborhoodsApiResponse = {
    city: { id: city.id, name: city.name, slug: city.slug },
    neighborhoods,
  };

  await setCache(cacheKeyStr, response);

  return NextResponse.json(response, {
    headers: {
      "X-Cache": "MISS",
      "X-RateLimit-Remaining": String(rl.remaining),
    },
  });
}
