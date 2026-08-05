FROM oven/bun:1.3.14-debian AS build-dependencies

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


FROM oven/bun:1.3.14-debian AS builder

WORKDIR /app
COPY --from=build-dependencies /app/node_modules ./node_modules
COPY package.json bun.lock svelte.config.js tsconfig.json vite.config.ts ./
COPY src ./src
COPY static ./static
RUN bun run build


FROM oven/bun:1.3.14-debian AS migration-dependencies

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production


FROM oven/bun:1.3.14-debian AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    TURSO_DATABASE_URL=file:/data/local.db

WORKDIR /app

RUN mkdir -p /data && chown bun:bun /data

COPY --from=builder --chown=bun:bun /app/build ./build
# svelte-adapter-bun's generated package omits @sveltejs/kit even though the
# built server imports it. Reuse the lockfile-verified build dependencies so
# the runtime has every external module used by the generated server.
COPY --from=build-dependencies --chown=bun:bun /app/node_modules ./build/node_modules
COPY --from=migration-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun drizzle ./drizzle
COPY --chown=bun:bun scripts/migrate.ts ./scripts/migrate.ts
COPY --chown=bun:bun src/lib/database-config.ts ./src/lib/database-config.ts
COPY --chown=bun:bun docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 0555 /usr/local/bin/docker-entrypoint.sh

USER bun
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["bun", "-e", "const response = await fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/health', { signal: AbortSignal.timeout(4000) }); if (!response.ok) process.exit(1)"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
