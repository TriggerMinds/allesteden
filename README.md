# Allesteden — Spatial Data Aggregator & Wijkenvergelijker

Open-source platform that aggregates Dutch public data (CBS, Police, Leefbaarometer, KNMI) and presents neighborhood-level insights through an interactive map and rankings. Inspired by allewijken.nl.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, react-leaflet
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + PostGIS (via `postgis/postgis`)
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Queue**: BullMQ + Redis for ETL pipelines
- **Logging**: Pino structured JSON logging

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Push database schema
npm run db:push

# 3. Start dev server
npm run dev

# 4. (Optional) Run ETL workers
npm run workers:dev
```

## Infrastructure

| Service | Image | Port |
|---|---|---|
| PostGIS | `postgis/postgis:16-3.4` | 5432 |
| Redis | `redis:7-alpine` | 6379 |

## API Endpoints

- `GET /api/cities` — List all cities with neighborhood counts (cached 1h)
- `GET /api/neighborhoods?city=[slug]` — List neighborhoods with GeoJSON boundaries and scores (cached 1h)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cities/route.ts
│   │   └── neighborhoods/route.ts
│   ├── [city-slug]/page.tsx
│   └── page.tsx
├── components/
│   ├── city-map.tsx
│   ├── city-card.tsx
│   ├── neighborhood-table.tsx
│   └── search-bar.tsx
├── lib/
│   ├── api/types.ts
│   ├── prisma/index.ts
│   ├── queue/
│   └── redis/
└── workers/
    ├── cbs-worker.ts
    ├── police-worker.ts
    ├── leefbaarometer-worker.ts
    └── index.ts
```
