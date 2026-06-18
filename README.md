# Allesteden — Spatial Data Aggregator & Wijkenvergelijker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-316192)](https://postgis.net/)

> Open-source platform that aggregates Dutch public data (CBS, Police, Leefbaarometer, KNMI) and presents neighborhood-level insights through an interactive map and rankings. Inspired by [allewijken.nl](https://allewijken.nl).

![Screenshot](public/globe.svg)

## Features

- 🗺️ **Interactive map** — Neighborhood boundaries rendered via react-leaflet with choropleth coloring by safety, green, or quiet score
- 📊 **Sortable rankings** — Compare neighborhoods on safety, greenery, and tranquility
- 🔄 **Automated ETL** — BullMQ workers ingest data from CBS/PDOK, Police API, and Leefbaarometer
- 🚀 **Redis caching** — API responses cached 1 hour with fast invalidation
- 🔒 **Rate limited** — Sliding-window rate limiter protects public endpoints
- 📈 **Observable** — Pino structured logging with job IDs, OpenTelemetry ready

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Mapping | react-leaflet (Leaflet) with GeoJSON choropleth |
| Database | PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis`) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Queue | BullMQ 5 + Redis 7 |
| Logging | Pino structured JSON |
| Tracing | OpenTelemetry (optional, via `OTEL_EXPORTER_OTLP_ENDPOINT`) |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostGIS** on port `5432` (user: `postgres`, password: `postgres`, database: `allesteden`)
- **Redis** on port `6379`

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local Docker)
```

### 3. Install Dependencies & Push Schema

```bash
npm install
npm run db:push
```

### 4. (Optional) Import Data via ETL Workers

```bash
# Start all workers
npm run workers:dev

# In another terminal, trigger data imports (once workers are running):
node --import tsx -e "
  const { addCbsImportJob } = require('./src/lib/queue/addJobs');
  addCbsImportJob().then(() => console.log('CBS job queued'));
"
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

### `GET /api/cities`

Returns all cities with neighborhood counts.

```json
{
  "cities": [
    { "id": 1, "name": "Amsterdam", "slug": "amsterdam", "neighborhoodCount": 15 }
  ]
}
```

### `GET /api/neighborhoods?city=[slug]`

Returns city info and neighborhoods with GeoJSON geometry and scores.

```json
{
  "city": { "id": 1, "name": "Amsterdam", "slug": "amsterdam" },
  "neighborhoods": [
    {
      "id": 1,
      "cityId": 1,
      "name": "Centrum",
      "slug": "centrum",
      "safetyScore": 7.5,
      "greenScore": 6.0,
      "quietScore": 4.2,
      "geometry": { "type": "MultiPolygon", "coordinates": [...] },
      "details": { "aantalinwoners": 90000 }
    }
  ]
}
```

## Project Structure

```
├── .docker/            Docker init scripts (PostGIS)
├── .github/            Issue & PR templates
├── prisma/             Prisma schema & migrations
├── public/             Static assets
└── src/
    ├── app/
    │   ├── api/        API route handlers
    │   ├── [city-slug]/ City detail pages
    │   └── page.tsx    Homepage
    ├── components/     React components
    ├── lib/
    │   ├── api/        Shared API types
    │   ├── prisma/     Prisma client singleton
    │   ├── queue/      BullMQ queues & jobs
    │   └── redis/      Cache & rate limiter
    └── workers/        ETL workers (CBS, Police, Leefbaarometer)
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run workers` | Run ETL workers (production) |
| `npm run workers:dev` | Run ETL workers with watch mode |

## Enterprise Features

- **Resilience**: BullMQ job retries with exponential backoff (5 attempts, 5s base delay)
- **Dead-letter**: Failed jobs retained 30 days, completed jobs 7 days
- **Concurrency**: Worker concurrency limits (2-3 parallel jobs per type)
- **Caching**: API responses cached 1h via Redis with ISR support
- **Rate limiting**: 100 requests/min per IP via Redis sliding window
- **Security**: PostgreSQL with parameterized queries (no SQL injection)
- **Observability**: Pino structured JSON logs with job ID context

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

## Data Sources

- [CBS Wijk- en buurtkaart](https://www.cbs.nl/nl-nl/dossier/nederland-regionaal/geografische-data/wijk-en-buurtkaart) via PDOK
- [Politie Open Data](https://data.politie.nl/)
- [Leefbaarometer](https://www.leefbaarometer.nl/)
- [KNMI Klimaatdashboard](https://www.knmi.nl/kennis-en-datacentrum/achtergrond/klimaatdashboard)
