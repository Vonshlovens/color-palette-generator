# `ctrl` deployment guide

This guide records the production deployment of Color Palette Generator on the `ctrl` Tailnet
machine. It uses Docker Compose, local libSQL storage in a named volume, and a remotely managed
Cloudflare Tunnel for `https://colors.vonshlovens.com`.

## Deployment layout

- Host: `ctrl`, SSH user `vonsh`
- Deployment source: `/home/vonsh/apps/colors`
- Compose project: `colors`
- Public hostname: `colors.vonshlovens.com`
- App service: `app`, bound only to `127.0.0.1:3000`
- Tunnel service: `cloudflared`, with no host port published
- Persistent local database: Compose volume `colors_palette-data`, mounted at `/data`

The tunnel reaches the app across the private Compose network at `http://app:3000`. The host does
not need an inbound router port-forward for this application.

## First-time tunnel setup

1. In Cloudflare, open **Networking > Tunnels**, create a remotely managed Cloudflared tunnel,
   and keep its connector token private.
2. Add a public hostname route:

   ```text
   colors.vonshlovens.com -> http://app:3000
   ```

3. On `ctrl`, create `/home/vonsh/apps/colors/.env` with mode `0600`:

   ```dotenv
   ORIGIN=https://colors.vonshlovens.com
   TUNNEL_TOKEN=eyJ...
   ```

4. Start both services:

   ```bash
   cd /home/vonsh/apps/colors
   chmod 600 .env
   docker compose --project-name colors --profile tunnel up --build --detach --wait
   ```

5. Verify the local and public endpoints:

   ```bash
   curl --fail http://127.0.0.1:3000/health
   curl --fail https://colors.vonshlovens.com/health
   ```

Cloudflare may flatten a proxied tunnel CNAME into A and AAAA answers. A direct CNAME query can
therefore be empty even when the public hostname works; the HTTPS health check is authoritative.

## Release updates

Run these commands from a clean local checkout after the target revision is on `main`. The sync
preserves the remote `.env` (including the tunnel token) and the Docker volume, while deleting
stale copied source files.

```bash
git pull --ff-only origin main
rsync -az --delete \
  --exclude='.git' \
  --exclude='.svelte-kit' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='local.db' \
  --exclude='*.db' \
  ./ vonsh@ctrl:/home/vonsh/apps/colors/
ssh vonsh@ctrl \
  'cd /home/vonsh/apps/colors && docker compose --project-name colors --profile tunnel up --build --detach --wait --wait-timeout 180'
```

Then verify the release:

```bash
ssh vonsh@ctrl 'cd /home/vonsh/apps/colors && docker compose --project-name colors ps'
ssh vonsh@ctrl 'curl --fail http://127.0.0.1:3000/health'
curl --fail https://colors.vonshlovens.com/health
```

If the public hostname was only just created and `ctrl` cannot resolve it while public resolvers
can, its configured DNS resolver may have a stale negative cache. This does not affect the active
Cloudflare tunnel; wait for the cache to expire or correct that resolver before relying on a
host-originated public HTTPS check.

## Operations and recovery

```bash
cd /home/vonsh/apps/colors
docker compose --project-name colors ps
docker compose --project-name colors logs --tail=100 app
docker compose --project-name colors logs --tail=100 cloudflared
docker compose --project-name colors restart app
```

The application entrypoint runs pending Drizzle migrations before starting Bun. Do not remove
`colors_palette-data` during normal container replacement: it contains the local production
database. Follow the backup procedure in the main README before copying `local.db`.

## Security boundary

The Compose configuration intentionally exposes the app only on loopback. Cloudflared establishes
an outbound connection to Cloudflare, and Cloudflare is the only public ingress path to this app.
This does not change the exposure of any unrelated services already listening on `ctrl`.

The web application itself is publicly reachable unless Cloudflare Access is enabled. In
particular, `POST /api/palettes` creates persistent public snapshots. Configure a per-client rate
limit for that endpoint in **Cloudflare > Security > WAF > Rate limiting rules** to limit request
and storage abuse. Keep `.env` private: anyone with `TUNNEL_TOKEN` can run a connector for the
tunnel.

## Optional Google authentication with Cloudflare Access

Cloudflare Access authenticates requests before they reach the tunnel; no SvelteKit or Docker
change is required. Protecting the entire hostname also protects public palette share links and
`/health`.

1. In **Cloudflare Zero Trust**, note the team domain:

   ```text
   https://<team-name>.cloudflareaccess.com
   ```

2. In Google Cloud Console, create a **Web application** OAuth client. Add:

   ```text
   Authorized JavaScript origin: https://<team-name>.cloudflareaccess.com
   Authorized redirect URI: https://<team-name>.cloudflareaccess.com/cdn-cgi/access/callback
   ```

3. In **Zero Trust > Integrations > Identity providers**, add **Google**, enter the client ID and
   client secret, enable PKCE, and test the login method.
4. In **Zero Trust > Access controls > Applications**, create a **Self-hosted and private**
   application for `colors.vonshlovens.com`.
5. Add an **Allow** policy. For one personal Google account, select:

   ```text
   Include > Emails > your-address@gmail.com
   ```

   Do not allow `Emails ending in @gmail.com`: that would admit every Gmail account. Use OIDC
   claims only when an identity-provider attribute, such as a Workspace domain or group, is the
   access requirement.

6. Select Google as the login method and enable instant authentication if it is the only provider.

To keep public palette share links while protecting the editor, create Access applications with
specific application paths instead of one policy covering the entire hostname.

## References

- [Cloudflare Tunnel overview](https://developers.cloudflare.com/tunnel/)
- [Cloudflare Tunnel routing](https://developers.cloudflare.com/tunnel/routing/)
- [Cloudflare Access application setup](https://developers.cloudflare.com/learning-paths/clientless-access/access-application/create-access-app/)
- [Google identity provider setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/)
- [Cloudflare rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
