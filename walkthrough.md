# Walkthrough — Allewijken Parity (Ranking & UI Redesign)

## Summary

Complete UI and API overhaul to match `allewijken.nl/amsterdam`. The city page is now a **ranking list** with a full-screen map background, no weight sliders, no demo data, and Dutch number formatting.

## Changes

### 1. Data Contract (`src/lib/api/types.ts`)

`NeighborhoodResponse` replaced with new fields:

| Field | Type | Source |
|---|---|---|
| `rank` | number | Computed from score DESC ordering |
| `wijknaam` | string | Parent neighborhood name from `details_json` |
| `buurtnaam` | string | The neighborhood name (formerly `name`) |
| `score` | number \| null | Average of 4 core metrics |
| `population` | number \| null | From `details_json.aantalinwoners` |
| `category` | string \| null | Score-based: Hoogste/Zeer hoog/Boven gemiddeld/Onder gemiddeld/Laagste |

### 2. API Route (`src/app/api/neighborhoods/route.ts`)

- `computeCoreScore()`: averages `theft_safety_score`, `social_safety_score`, `green_score`, `quiet_score`. Falls back to `safety_score`, then 5.
- `computeCategory()`: thresholds: ≥8=Hoogste, ≥7=Zeer hoog, ≥6=Boven gemiddeld, ≥4=Onder gemiddeld, <4=Laagste.
- Data pipeline: raw SQL → score computation → sort DESC → assign rank → add category → return.

### 3. Number Formatting (`src/lib/utils.ts`)

- `formatScore()`: `Intl.NumberFormat("nl-NL")` with 1 decimal — outputs `8,3` instead of `8.3`
- `formatPopulation()`: `Intl.NumberFormat("nl-NL")` — outputs `95.000` instead of `95k`

### 4. UI Redesign (`city-content.tsx`)

| Before | After |
|---|---|
| `{cityName}` heading | `Alle wijken in {cityName}` |
| Weight sliders, sort pills, search | **Removed entirely** |
| Medals for top 3 (`<Medal/>`) | Simple `#1`, `#2`, `#3` for all |
| Cards with icons/scores/population/income | Clean ranking rows: `#rank`, buurtnaam/wijknaam, score, category badge |
| 20 hardcoded demo neighborhoods | **Empty state** with "Data laden..." when no DB data |
| `details` with fallback extraction | Population directly from API `population` field |
| Complex weighted score calculation | Single `score` from API |

### 5. Page Component (`page.tsx`)

- Removed `DEMO_NEIGHBORHOODS` constant entirely
- Removed `DEMO_GEOMETRIES` import and `demo-geometry.ts` file
- When API returns null, passes empty array → city-content shows empty state

### 6. Map Component (`city-map.tsx`)

- Simplified: only colors by `score` — no metric selection
- Removed `SortKey`, `weightedScores`, `selectedMetric` props
- `buildFeatureCollection` uses `score` directly from API response
- Legend shows static "Score" title
- Popup shows neighborhood name + score value

### 7. Tests (`api-types.test.ts`)

Updated to test new `NeighborhoodResponse` shape with `rank`, `wijknaam`, `buurtnaam`, `score`, `population`, `category`.

## Verification

```bash
npm run typecheck   # 0 errors
npm run lint        # 0 errors, 0 warnings
npm test            # 21/21 passed
npm run dev         # 0 console errors
```
