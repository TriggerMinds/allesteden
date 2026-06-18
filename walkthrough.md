# Walkthrough - Allewijken Parity (Ranking & UI Redesign)

## Summary

Complete UI and API overhaul to match `allewijken.nl/amsterdam`. The city page is now a ranking list with a full-screen map background, no weight sliders, no demo data, and Dutch number formatting.

## Changes

### 1. Data Contract (`src/lib/api/types.ts`)

`NeighborhoodResponse` replaced with new fields:

| Field | Type | Source |
|---|---|---|
| `rank` | number | Computed from score DESC ordering |
| `wijknaam` | string | Parent neighborhood name from `details_json` |
| `buurtnaam` | string | The neighborhood name, formerly `name` |
| `score` | number or null | Average of 4 core metrics |
| `population` | number or null | From `details_json.aantalinwoners` |
| `category` | string or null | Score-based category |

### 2. API Route (`src/app/api/neighborhoods/route.ts`)

- `computeCoreScore()` averages `theft_safety_score`, `social_safety_score`, `green_score`, `quiet_score`.
- `computeCoreScore()` falls back to `safety_score`, then 5.
- `computeCategory()` uses these thresholds: 8 and higher is Hoogste, 7 and higher is Zeer hoog, 6 and higher is Boven gemiddeld, 4 and higher is Onder gemiddeld, lower than 4 is Laagste.
- Data flow: raw SQL, score computation, score DESC sort, rank assignment, category assignment, response.

### 3. Number Formatting (`src/lib/utils.ts`)

- `formatScore()` uses `Intl.NumberFormat("nl-NL")` with 1 decimal. Example: `8,3`.
- `formatPopulation()` uses `Intl.NumberFormat("nl-NL")`. Example: `95.000`.

### 4. UI Redesign (`city-content.tsx`)

| Before | After |
|---|---|
| `{cityName}` heading | `Alle wijken in {cityName}` |
| Weight sliders, sort pills, search | Removed entirely |
| Medals for top 3 | Simple `#1`, `#2`, `#3` for all |
| Cards with multiple score icons | Clean ranking rows with rank, buurtnaam, wijknaam, score, category badge |
| 20 hardcoded demo neighborhoods | Empty state with `Data laden...` when no DB data |
| Details-based population extraction | Population directly from API `population` field |
| Complex weighted score calculation | Single `score` from API |

### 5. Page Component (`page.tsx`)

- Removed the hardcoded demo neighborhood fallback.
- Removed demo geometry dependency from the city page.
- When the API returns null, the page passes an empty array to `CityContent`.
- City slug fallback is formatted for display. Example: `amsterdam` becomes `Amsterdam`.

### 6. Map Component (`city-map.tsx`)

- Simplified to color only by `score`.
- Removed metric switching props.
- `buildFeatureCollection` uses `score` directly from the API response.
- Legend title is `Score`.
- Popup shows neighborhood name and score.

### 7. Empty-State Map Hotfix

The first parity update returned early from `city-content.tsx` when `neighborhoods.length === 0`. That prevented `CityMap` from mounting. Result: `/amsterdam` showed only a full-page `Data laden...` state when the local database or API had no rows.

Fixed behavior:

- `CityMap` now always mounts as the page background.
- The empty state now renders inside the ranking side panel.
- No hardcoded demo-neighborhood fallback was restored.
- The list footer contains `Kaart laden...` and the `Feedback` link.

### 8. Tests (`api-types.test.ts`)

Updated to test the new `NeighborhoodResponse` shape with `rank`, `wijknaam`, `buurtnaam`, `score`, `population`, and `category`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run dev
```

Expected runtime behavior: the map remains visible even when the local database has no Amsterdam rows yet.
