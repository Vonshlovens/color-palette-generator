# Color Palette Generator

A visual tool for generating harmonious color palettes using color theory algorithms.

## Features

- **6 Harmony Types**: Complementary, Analogous, Triadic, Split-Complementary, Tetradic, Monochromatic
- **Interactive Color Picker**: HSL sliders and HEX input
- **Live Preview**: Real-time palette generation
- **One-Click Copy**: Click any swatch to copy its HEX value
- **Export Options**: CSS variables, Tailwind config, or JSON
- **Saved Palettes (v2)**: Create immutable snapshots with public share links

## Tech Stack

- Svelte 5 with runes ($state, $props, $effect, $derived)
- SvelteKit for routing
- Tailwind CSS v4 for styling
- Turso/libSQL with Drizzle ORM for persistence
- TypeScript for type safety

## Development

```bash
# Install dependencies
bun install

# Configure a local file database (optional; this is the default)
cp .env.example .env

# Apply committed migrations
bun run db:migrate

# Start dev server
bun run dev

# Generate a migration after changing the schema
bun run db:generate

# Open Drizzle Studio
bun run db:studio

# Build for production
bun run build

# Preview production build
bun run preview
```

`TURSO_DATABASE_URL` defaults to `file:local.db`. Set it to a remote libSQL URL in production and
provide `TURSO_AUTH_TOKEN`; the token is read only by server-side modules and migration tooling.
Run `bun run db:migrate` before starting each deployed application version.

Saved snapshots persist only their name, HSL generator inputs, harmony type, public slug, and
timestamps. Generated HEX/RGB colors are always derived at runtime. The public API is:

- `POST /api/palettes` — create a new immutable snapshot
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
