import { defineConfig } from 'drizzle-kit';

// `db:generate` only diffs the schema against drizzle/meta, so it needs no credentials.
// Wrangler applies the generated SQL to D1 (see `migrations_dir` in wrangler.jsonc).
// `db:studio` connects to the remote D1 database over HTTP when these are set.
const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN } = process.env;
const d1Http =
  CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_DATABASE_ID && CLOUDFLARE_D1_TOKEN
    ? ({
        driver: 'd1-http',
        dbCredentials: {
          accountId: CLOUDFLARE_ACCOUNT_ID,
          databaseId: CLOUDFLARE_DATABASE_ID,
          token: CLOUDFLARE_D1_TOKEN
        }
      } as const)
    : {};

export default defineConfig({
  schema: './src/lib/server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  ...d1Http,
  strict: true,
  verbose: true
});
