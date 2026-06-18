# Walkthrough — theftSafetyScore & socialSafetyScore Integration

## Overview

The backend agent has added two new columns to the `neighborhoods` table:

- `theft_safety_score` (0–10) — Score based on burglary/theft crime data (CBS 47018NED)
- `social_safety_score` (0–10) — Score based on social safety (vandalism, nuisance)

This walkthrough describes all frontend changes made to support these new data points.

## Changes Made

### 1. API Route (`src/app/api/neighborhoods/route.ts`)

- Added `theft_safety_score` and `social_safety_score` to the `$queryRawUnsafe` SELECT statement
- Added both fields to the type annotation of the raw query result
- Mapped `theft_safety_score` → `theftSafetyScore` and `social_safety_score` → `socialSafetyScore` in the API response (snake_case DB → camelCase TypeScript)

### 2. TypeScript Types (`src/lib/api/types.ts`)

Added two new required fields to `NeighborhoodResponse`:

```ts
theftSafetyScore: number | null;
socialSafetyScore: number | null;
```

### 3. Prisma Schema (`prisma/schema.prisma`)

The schema was already updated by the backend agent:

```prisma
socialSafetyScore     Float?   @map("social_safety_score")
theftSafetyScore      Float?   @map("theft_safety_score")
```

### 4. Map Coloring (`src/components/city-map.tsx`)

- Extended `SortKey` type: added `"theftSafetyScore"` and `"socialSafetyScore"`
- `buildFeatureCollection` now includes both scores in each feature's properties
- Map polygons can be colored by theft or social safety when selected in the sort pills

### 5. City Dashboard (`src/app/[city-slug]/city-content.tsx`)

**Card badges** — replaced the single `Star + safetyScore` with two detailed badges:

| Icon | Label | Field | Color |
|---|---|---|---|
| Shield | Woninginbraken | `theftSafetyScore` | Red |
| Users (orange) | Sociale veiligheid | `socialSafetyScore` | Orange |
| TreeDeciduous | Groen | `greenScore` | Emerald |
| Ear | Rust | `quietScore` | Sky |

**Sort pills** — new filter options in the floating panel:

| Pill | Sorts by | Map color |
|---|---|---|
| Totaal | Weighted score | Weighted |
| Inbraken | `theftSafetyScore` | Theft |
| Sociaal | `socialSafetyScore` | Social |
| Groen | `greenScore` | Green |
| Rust | `quietScore` | Quiet |
| Naam | Alphabetical | Current metric |

**Weight sliders** — the preferences panel now has 4 sliders instead of 3:

| Slider | Icon | Default % |
|---|---|---|
| Woninginbraken | Shield | 25% |
| Sociale veiligheid | Users | 25% |
| Groen | TreeDeciduous | 25% |
| Rust | Ear | 25% |

Weighted score formula:

```
(theftSafetyScore × 0.25) + (socialSafetyScore × 0.25) + (greenScore × 0.25) + (quietScore × 0.25)
```

**Detail panel** — when clicking a neighborhood, the detail view now shows two rows:
1. Top row: Woninginbraken (red), Sociale veiligheid (orange), Groen (green), Rust (sky)
2. Bottom row: Inwoners (violet), Inkomen (zinc) — if available

### 6. Demo Data (`src/app/[city-slug]/page.tsx`)

All 7 demo neighborhoods now include realistic `theftSafetyScore` and `socialSafetyScore` values.

### 7. Tests (`src/__tests__/api/api-types.test.ts`)

Updated API type tests to include the two new fields in mock objects.

### 8. ESLint Cleanup

Fixed two pre-existing warnings in worker files:
- `cbs-worker.ts`: removed unused `prisma` destructure; replaced `any` with specific type
- `police-worker.ts`: replaced `any` with `Record<string, unknown>`

## Verification

```bash
npm run typecheck   # 0 errors
npm run lint        # 0 errors, 0 warnings
npm test            # 21/21 passed
npm run dev         # 0 console errors on / and /amsterdam
```

## Screenshots

The city dashboard at `/[city-slug]` now shows:
- Card badges: Shield (theft) + Users (social) + Tree (green) + Ear (quiet)
- Sort pills including "Inbraken" and "Sociaal"
- Weights panel with 4 sliders
- Detail view with 6 metric cards
