# Color Palette Generator

A visual tool for generating harmonious color palettes using color theory algorithms.

## Features

- **7 Harmony Types**: Complementary, Analogous, Triadic, Split-Complementary, Tetradic, Monochromatic, 60-30-10
- **Harmony-aware layouts**: Swatch count and arrangement match the selected relationship
- **60-30-10 website preview**: Abstract page mock for dominant / secondary / accent roles
- **Interactive Color Picker**: HSL sliders plus HEX and RGB inputs
- **Live Preview**: Real-time palette generation
- **One-Click Copy**: Click any swatch to copy its HEX value
- **Export Options**: CSS variables, Tailwind config, or JSON
- **Saved Palettes (v2)**: Create immutable snapshots with public share links
- **Gallery (v3)**: Browse database-backed saved palettes at `/palettes`

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

# Run type/Svelte checks and tests
bun run check
bun run test

# Run tests in watch mode
bun run test:watch

# Build for production
bun run build

# Preview production build
bun run preview
```

`TURSO_DATABASE_URL` defaults to `file:local.db`. An empty `TURSO_AUTH_TOKEN` is treated as absent.
Set both values for a remote libSQL database. `bun run db:migrate` applies the committed,
Drizzle-tracked migrations and can be run from any working directory.

## Docker self-hosting

The zero-configuration deployment uses local file libSQL on a named volume:

```bash
docker compose up --build -d
docker compose ps
curl --fail http://localhost:3000/health
```

The app is exposed on `127.0.0.1:3000` by default. Set `APP_PORT` to change the host port and update
`ORIGIN` to its externally visible URL. Set `APP_BIND_ADDRESS=0.0.0.0` only when direct network
access is intentional. The container always listens on port 3000.

Compose stores the database at `/data/local.db` in the `palette-data` named volume. Keep this
volume when replacing containers. For a consistent local backup, stop writes before copying:

```bash
docker compose stop app
docker compose cp app:/data/local.db ./local.db.backup
docker compose start app
```

The entrypoint creates the local database directory, invokes the committed migrations once per
start (already-applied migrations are skipped by Drizzle), and then starts the Bun server as a
non-root user. A failed migration prevents the application from starting. In production, `file:`
database URLs must contain an absolute path; use `file:/data/local.db` for the mounted volume.

Automatic entrypoint migrations assume that only one replica is starting. For a multi-replica
deployment, run `bun run /app/scripts/migrate.ts` from the release image as a one-off deployment
step, wait for it to succeed, and only then start or scale the application replicas.

### Remote Turso

For managed production storage, create a local `.env` file for Compose and restrict its
permissions. `.env` files are ignored by Git and the Docker build context:

```dotenv
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
ORIGIN=https://palettes.example.com
```

```bash
chmod 600 .env
docker compose up --build -d
```

The local volume remains mounted but is unused while `TURSO_DATABASE_URL` is remote. Use Turso's
backup facilities for remote databases.

### Reverse proxy

Prefer a fixed HTTPS `ORIGIN` and keep the default loopback bind when the proxy runs on the Docker
host. A proxy on another host requires an intentionally restricted `APP_BIND_ADDRESS` and firewall.
If dynamic forwarded host/protocol handling is required, set `ORIGIN=` plus
`PROTOCOL_HEADER=x-forwarded-proto` and `HOST_HEADER=x-forwarded-host`. Set
`ADDRESS_HEADER=x-forwarded-for` only when client IPs are needed, with `XFF_DEPTH` equal to the exact
number of trusted proxies. Never trust these headers while the app port is directly client-accessible.
Because `POST /api/palettes` is public and creates persistent records, configure request rate limits
and reasonable body-size limits for that route at the trusted reverse proxy to prevent storage and
request-flood abuse.

Docker and Compose health checks call `/health` with Bun itself; the endpoint verifies both the app
and database and returns HTTP 503 when the database is unavailable. Inspect status with
`docker compose ps` and logs with `docker compose logs app`.

### Cloudflare Tunnel

The optional `cloudflared` service is a remotely-managed Cloudflare Tunnel connector. It remains
disabled unless the `tunnel` Compose profile is enabled, so ordinary local self-hosting does not
require Cloudflare credentials. Keep the app bound to loopback; `cloudflared` reaches it directly
over the private Compose network as `http://app:3000`.

For the current `ctrl` deployment, release, DNS, security, and optional Cloudflare Access setup,
see [the operational deployment guide](docs/ctrl-deployment.md).

After creating a remotely-managed tunnel in the Cloudflare dashboard, add its connector token and
the public URL to the deployment `.env` file (which is ignored by Git):

```dotenv
ORIGIN=https://colors.vonshlovens.com
TUNNEL_TOKEN=eyJ...
```

Restrict the file and start both services:

```bash
chmod 600 .env
docker compose --profile tunnel up --build -d
docker compose ps
docker compose logs -f cloudflared
```

In the tunnel's public-hostname route, map `colors.vonshlovens.com` to
`http://app:3000`. Cloudflare creates the DNS record automatically when the `vonshlovens.com`
zone is active in the same Cloudflare account. Verify the published application with:

```bash
curl --fail https://colors.vonshlovens.com/health
```

Saved snapshots persist their name, base HSL generator inputs, any locked swatch HSL overrides,
harmony type, public slug, and timestamps. Generated HEX/RGB colors are always derived at runtime.
The public API is:

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
