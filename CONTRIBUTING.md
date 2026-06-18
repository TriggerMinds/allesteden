# Contributing to Allesteden

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold its terms.

## How Can I Contribute?

### Reporting Bugs

1. Check existing [Issues](https://github.com/TriggerMinds/allesteden/issues) to avoid duplicates.
2. Open a [Bug Report](https://github.com/TriggerMinds/allesteden/issues/new?template=bug_report.md) with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, Docker version)

### Suggesting Features

1. Open a [Feature Request](https://github.com/TriggerMinds/allesteden/issues/new?template=feature_request.md).
2. Explain *why* the feature is useful and how it should work.

### Pull Requests

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Follow coding conventions:
   - TypeScript strict mode
   - ESLint must pass (0 warnings)
   - Prettier formatting
   - No `any` types unless absolutely necessary
3. Write or update tests.
4. Ensure all checks pass:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```
5. Open a PR against `main`.

### Development Setup

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Push database schema
npm run db:push

# 4. Run ETL workers (import CBS, Police, Leefbaarometer data)
npm run workers:dev

# 5. Start Next.js dev server
npm run dev
```

### Project Structure

```
src/
├── app/          Next.js App Router pages & API routes
├── components/   React components (Tailwind CSS)
├── lib/          Prisma client, queue, Redis, API types
└── workers/      BullMQ ETL workers
```

## Questions?

Open a [Discussion](https://github.com/TriggerMinds/allesteden/discussions) or tag `@TriggerMinds`.
