# Fantasy App v2

A modern Next.js 15 application for delivering a data-rich NFL fantasy football experience. The project is optimized for high-volume external data ingestion (ESPN APIs) and a responsive UI powered by Tailwind CSS v4 and shadcn/ui components.

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4 + shadcn/ui component library
- ESLint 9, Turbopack dev/build pipeline

## Local Development

Install dependencies once after cloning:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` and edit files under `src/app` or `src/components`—changes hot reload automatically.

Run linting to validate code quality:

```bash
npm run lint
```

Warm the ESPN data snapshot (run this whenever you need fresh data or set it up on a scheduler):

```bash
npm run ingest
```

## Data Documentation

Detailed notes for the ESPN data sources used by the app live under `docs/`.

- [NFL Athletes Catalogue](docs/data/espn-athletes-endpoint.md): collection endpoint schema, usage tips, and sample payloads.
- [NFL Athlete Detail Endpoints](docs/data/espn-athlete-detail-endpoints.md): per-athlete profile, stats, gamelog, splits, and league leaderboard feeds.
- [NFL Teams Endpoint](docs/data/espn-teams-endpoint.md): franchise metadata, branding assets, and navigation links.
- [NFL Team Detail Endpoints](docs/data/espn-team-detail-endpoints.md): team profile, roster, schedule, statistics, and record feeds.

Additional endpoints will be documented in the same directory as they are integrated.

## Project Goals

- Aggregate and normalize ESPN NFL data to power fantasy-focused insights.
- Prioritize fast data access and responsive UI interactions even with large payloads.
- Provide clear internal documentation so additional agents can extend features confidently.
