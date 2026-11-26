# Color Palette Generator

A visual tool for generating harmonious color palettes using color theory algorithms.

## Features

- **7 Harmony Types**: Complementary, Analogous, Triadic, Split-Complementary, Tetradic, Monochromatic, 60-30-10
- **Harmony-aware layouts**: Swatch count and arrangement match the selected relationship
- **60-30-10 website preview**: Abstract page mock for dominant / secondary / accent roles
- **Interactive Color Picker**: HSL sliders and HEX input
- **Live Preview**: Real-time palette generation
- **One-Click Copy**: Click any swatch to copy its HEX value
- **Export Options**: CSS variables, Tailwind config, or JSON
- **Saved Palettes (v2)**: Create immutable snapshots with public share links
- **Gallery (v3)**: Browse database-backed saved palettes at `/palettes`

## Tech Stack

- Svelte 5 with runes ($state, $props, $effect, $derived)
- SvelteKit for routing
- Tailwind CSS v4 for styling
- Cloudflare Workers (`@sveltejs/adapter-cloudflare`) with Cloudflare D1 and Drizzle ORM
- TypeScript for type safety

## Development

```bash
# Install dependencies
bun install

# Apply committed migrations to the local D1 database (.wrangler/state)
bun run db:migrate

# Start dev server; Vite provides the local D1 binding as platform.env.DB
bun run dev

# Generate a migration after changing src/lib/server/db/schema/
bun run db:generate

# Run type/Svelte checks and tests
bun run check
bun run test

# Run tests in watch mode
bun run test:watch

# Build for production
bun run build

# Build, then serve the production Worker locally with Wrangler (same local D1)
bun run preview
```

No `.env` file is needed. All database access goes through the `DB` D1 binding declared in
`wrangler.jsonc`; `src/hooks.server.ts` creates a Drizzle client for each request as
`event.locals.db`. Wrangler tracks applied migrations from `drizzle/` in the `d1_migrations` table.
The integration tests start their own in-memory local D1 databases and apply the same migrations.

### Database layout

```
src/lib/server/db/
├── index.ts          # createDb(d1) and the Database type
└── schema/
    ├── index.ts      # re-exports every table module (drizzle-kit reads this)
    └── palettes.ts
```

Add new tables (for example, authentication tables) as another module in `schema/` and re-export
it from `schema/index.ts`; `bun run db:generate` then writes the next migration to `drizzle/`.

## Deploying to Cloudflare

The app is a single Worker that serves static assets and SvelteKit routes, backed by one D1
database. Everything fits the Workers Free plan (100,000 requests/day, 10 ms CPU per request,
3 MiB compressed Worker size; D1: 500 MB per database, 5 million rows read and 100,000 rows
written per day). Nothing in `wrangler.jsonc` requires a paid plan.

```bash
bunx wrangler login

# First deploy: Wrangler creates the "color-palette-generator" D1 database and writes its
# database_id into wrangler.jsonc. Commit that change.
bun run deploy
bun run db:migrate:remote

# Later releases: migrate before deploying code that needs a new schema.
bun run db:migrate:remote
bun run deploy
```

The Worker is served at `https://color-palette-generator.<account-subdomain>.workers.dev`. To serve
it on a custom domain, uncomment the `routes` entry in `wrangler.jsonc`; a hostname that still has
a DNS record (such as a Cloudflare Tunnel CNAME) must have that record removed or replaced when the
custom domain is attached. Cloudflare Access applications on the hostname keep applying to the
Worker.

`POST /api/palettes` is public and creates persistent records. Add a Cloudflare WAF rate limiting
rule for that path (the Free plan includes one) to limit request and storage abuse.

`/health` verifies both the Worker and D1 and returns HTTP 503 when the database is unavailable.
Use `bunx wrangler tail` or the Workers observability dashboard for logs.

Saved snapshots persist only their name, HSL generator inputs, harmony type, public slug, and
timestamps. Generated HEX/RGB colors are always derived at runtime. The public API is:

- `POST /api/palettes` — create a new immutable snapshot
- `GET /api/palettes` — list public snapshots, newest first (`limit` ≤ 50, `offset` pagination)
- `GET /api/palettes/:slug` — retrieve a public snapshot
- `GET /health` — report application and database availability

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components
│   ├── color/          # Color conversion & harmony algorithms
│   ├── server/         # Server-only database and palette persistence
│   ├── stores/         # Reactive state management
│   └── types.ts        # TypeScript definitions
├── routes/             # SvelteKit pages
└── app.css            # Global styles
specs/                  # Design specifications
```
