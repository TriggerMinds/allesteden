Please read the `AGENTS.md` file in the root of the project to understand the core goal, architecture, and enterprise standards.

Your task is to build a production-ready spatial data aggregator and neighborhood comparison platform (similar to allewijken.nl) using open public data from the CBS (Centraal Bureau voor de Statistiek), PDOK, and the Police API.

Execute the following phased implementation plan step-by-step. Do not move to the next phase until the current one is fully implemented and tested.

### Phase 1: Infrastructure & Database Setup
1. Scaffold a Next.js (App Router) project with Tailwind CSS and TypeScript.
2. Create a `docker-compose.yml` file containing:
   - A `postgis/postgis` PostgreSQL database.
   - A Redis instance for caching and queues.
   - Include healthchecks and memory limits for both.
3. Configure Drizzle ORM or Prisma to connect to the PostGIS database.
4. Define the database schema:
   - `City` (id, name, slug)
   - `Neighborhood` (id, cityId, name, slug, geometry (Polygon/MultiPolygon), safety_score, green_score, quiet_score, details_json)

### Phase 2: ETL Pipeline & Queue (BullMQ)
1. Implement a BullMQ worker and queue system connected to Redis.
2. Create Python or Node.js ETL scripts/jobs for downloading and importing data:
   - Job 1: Download CBS "Wijk- en buurtkaart" (Shapefile/GeoJSON) from PDOK and upsert geometries into the database.
   - Job 2: Fetch crime statistics from the open Police API (`data.politie.nl`).
   - Job 3: Fetch livability scores (Leefbaarometer) and climate data.
   - Ensure the worker handles retries, exponential backoff, and logs errors to a dead-letter queue.
3. Set up structured logging using Pino for all worker processes.

### Phase 3: Core API & Caching
1. Build Next.js API routes (or Server Actions):
   - `GET /api/cities` - List popular cities.
   - `GET /api/neighborhoods?city=[slug]` - List neighborhoods for a city with their scores and boundary geometries.
2. Implement a Redis caching layer for these endpoints with a 1-hour TTL to prevent DB overload.
3. Implement basic rate limiting for the public API endpoints.

### Phase 4: Frontend UI & Mapping
1. Build the Homepage (`/`): A hero search bar to find cities, and a grid of popular cities (SSR/SSG).
2. Build the City Page (`/[city-slug]`): Display a list of neighborhoods ranked by safety/greenery.
3. Integrate a mapping library (e.g., `react-map-gl` or Leaflet) to display the geographic boundaries of the neighborhoods using the PostGIS geometry data.
4. Ensure the design uses Tailwind CSS, is responsive, and achieves 100 on Lighthouse for accessibility.

### Phase 5: Testing, Observability & OSS Community Files
1. Write unit tests for the BullMQ workers and integration tests for the API routes using Vitest or Jest.
2. Add OpenTelemetry tracing setup to track request latency.
3. Generate standard OSS files: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and GitHub Issue/PR templates.
4. Provide a `README.md` with clear instructions on how to start the `docker-compose` stack, run the ETL jobs, and start the Next.js app.

Take your time and ensure all Enterprise-Grade Engineering Standards from `AGENTS.md` are strictly followed. Let's begin Phase 1.
