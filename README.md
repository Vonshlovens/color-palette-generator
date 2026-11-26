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
- **Freeform** (`/freeform`): 1–7 swatches with no harmony rule; Space randomizes every unlocked swatch
- **Saved Palettes (v2)**: Save the exact swatches on screen with a public share link; the creator
  or owner can rename or delete them
- **Gallery (v3)**: Browse database-backed saved palettes at `/palettes`
- **Owner-approved accounts**: Magic-link sign-in, plus optional GitHub sign-in; saving palettes
  requires an account the owner approved at `/approvals`. Generating palettes stays in the browser
  and needs no account.

## Tech Stack

- Svelte 5 with runes ($state, $props, $effect, $derived)
- SvelteKit for routing
- Tailwind CSS v4 for styling
- Cloudflare Workers (`@sveltejs/adapter-cloudflare`) with Cloudflare D1 and Drizzle ORM
- Better Auth (magic link plugin, optional GitHub OAuth) for owner-approved sign-in
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
    ├── auth.ts       # Better Auth user/session/account/verification + approval status
    └── palettes.ts   # saved palettes (created_by references user)
```

Add new tables as another module in `schema/` and re-export it from `schema/index.ts`;
`bun run db:generate` then writes the next migration to `drizzle/`.

## Deploying to Cloudflare

The app is a single Worker that serves static assets and SvelteKit routes, backed by one D1
database. Everything fits the Workers Free plan (100,000 requests/day, 10 ms CPU per request,
3 MiB compressed Worker size; D1: 500 MB per database, 5 million rows read and 100,000 rows
written per day). Nothing in `wrangler.jsonc` requires a paid plan.

```bash
bunx wrangler login

# First deploy: apply migrations to the remote D1 database (already bound in wrangler.jsonc),
# deploy, then set the secrets listed under "Accounts and approvals".
bun run db:migrate:remote
bun run deploy

# Later releases: migrate before deploying code that needs a new schema.
bun run db:migrate:remote
bun run deploy
```

The Worker is served only at its custom domain, `https://colors.ericevans.dev` (`routes` in
`wrangler.jsonc`); `workers.dev` and preview URLs are disabled. Non-secret settings
(`BETTER_AUTH_URL`, `AUTH_EMAIL_FROM`, `OWNER_EMAIL`) are `vars` in `wrangler.jsonc`; secrets are
set with `wrangler secret put` (see below).

`POST /api/palettes` requires an approved session, and Better Auth rate-limits its own endpoints
per isolate, but a Cloudflare WAF rate limiting rule for `/api/*` (the Free plan includes one) still
limits request abuse.

`/health` verifies both the Worker and D1 and returns HTTP 503 when the database is unavailable.
Use `bunx wrangler tail` or the Workers observability dashboard for logs.

## Accounts and approvals

Sign-in uses magic links, plus GitHub when it is configured (no passwords), and every account
except the owner needs approval:

1. A visitor submits **Request access** at `/sign-in`. This stores a `pending` user and sends no
   email. New requests are refused while `AUTH_MAX_PENDING_REQUESTS` (default 25) are pending.
2. The owner (`OWNER_EMAIL`, default `eric@ericevans.dev`) signs in at `/sign-in`. The owner account
   is created and approved on first sign-in; no database edits are needed.
3. At `/approvals` the owner approves, rejects, or revokes people. Approving emails them; rejecting
   or revoking deletes their sessions.
4. Approved people request a one-time link (valid 15 minutes) at `/sign-in` and can then save.

A sign-in request for an email without approved access gets the same response but sends no email
and writes nothing, and each address can receive at most one link per minute. Sessions are only
created for approved users, so a link issued before a revoke cannot be redeemed.

`src/hooks.server.ts` builds the D1 client and Better Auth per request with
`createAuth(event.locals.db, config)`, reading settings from the Worker's vars and secrets in
`event.platform.env`. Auth uses only `fetch` and Web Crypto.

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Secret; required outside `bun run dev`. 32+ random characters (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | Public URL used in sign-in links, set in `wrangler.jsonc` `vars`. Required outside `bun run dev`, which uses the request origin. |
| `OWNER_EMAIL` | Owner/admin email; defaults to `eric@ericevans.dev`. |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | Email delivery via the Resend HTTP API. `AUTH_EMAIL_FROM` must use a domain verified in Resend. |
| `AUTH_MAX_PENDING_REQUESTS` | Cap on pending access requests (default 25), including ones made by GitHub sign-in. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional secrets. GitHub sign-in and the Connect GitHub control appear only when both are set. |

Without `RESEND_API_KEY`, emails (including sign-in links) are printed to the server console under
`bun run dev`, or under `bun run preview` when `BETTER_AUTH_URL` is a localhost URL. Any other
deployment refuses to send without it.

For `bun run preview` (`wrangler dev`), copy `.dev.vars.example` to `.dev.vars` (git-ignored). In
production, set the two secrets with Wrangler:

```bash
openssl rand -base64 32 | bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put RESEND_API_KEY
```

### GitHub sign-in

GitHub uses the same approval gate:

- **Continue with GitHub** at `/sign-in` signs approved people straight in. A GitHub login whose
  verified email has no account becomes a `pending` request in `/approvals` (unless
  `AUTH_MAX_PENDING_REQUESTS` are already pending, in which case nothing is stored). It gets no
  session: the person lands on `/sign-in` with "Access requested — waiting for owner approval".
- A GitHub login joins an existing account automatically only when GitHub has verified that same
  email. GitHub is not a trusted provider on purpose, so an unverified email on someone else's
  GitHub account can never sign in to an existing account; that person is asked to sign in with
  an email link instead.
- To use a GitHub account whose email differs from yours, sign in with an email link, open
  `/account` (click your initial in the header), and choose **Connect GitHub**. After that,
  Continue with GitHub opens the same account. Disconnect it there at any time; the email link
  always keeps working.
- Choosing Continue with GitHub *before* connecting it creates a separate pending account for the
  GitHub email. Remove it in `/approvals`, then connect GitHub from `/account`.

To set it up, create a GitHub OAuth app at
[github.com/settings/applications/new](https://github.com/settings/applications/new):

| Field | Value |
| --- | --- |
| Homepage URL | `https://colors.ericevans.dev` |
| Authorization callback URL | `https://colors.ericevans.dev/api/auth/callback/github` |

Generate a client secret, then store both values as Worker secrets and deploy:

```bash
bunx wrangler secret put GITHUB_CLIENT_ID
bunx wrangler secret put GITHUB_CLIENT_SECRET
```

GitHub OAuth apps allow one callback URL, so local work needs a second OAuth app with the callback
`http://localhost:5173/api/auth/callback/github` (`bun run dev`) or
`http://localhost:8787/api/auth/callback/github` (`bun run preview`), and its values in `.dev.vars`.

Saved palettes store their name, the exact swatches as a JSON array of HSL values (`colors`, 1–7),
the harmony (or `freeform`), the HSL generator seed, public slug, and timestamps. Rows saved before
`colors` existed have it null and their swatches are generated from the seed when read. HEX/RGB
values are derived at runtime. The public API is:

- `POST /api/palettes` — save a palette (approved, signed-in users only; 401 otherwise). Harmony
  palettes send `{name, hue, saturation, lightness, harmony, colors?}`; freeform palettes send
  `{name, harmony: "freeform", colors}`.
- `GET /api/palettes` — list public palettes, newest first (`limit` ≤ 50, `offset` pagination)
- `GET /api/palettes/:slug` — retrieve a public palette
- `PATCH /api/palettes/:slug` — rename (`{name}`); `DELETE /api/palettes/:slug` — delete. Both
  require the palette's creator or the owner (401 signed out, 403 otherwise).
- `GET /health` — report application and database availability

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components
│   ├── color/          # Color conversion & harmony algorithms
│   ├── server/         # Server-only database, auth, and palette persistence
│   ├── stores/         # Reactive state management
│   └── types.ts        # TypeScript definitions
├── routes/             # SvelteKit pages
└── app.css            # Global styles
specs/                  # Design specifications
```
