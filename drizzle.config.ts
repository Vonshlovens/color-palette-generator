import { defineConfig } from 'drizzle-kit';
import { parseDatabaseConfig } from './src/lib/database-config';

const database = parseDatabaseConfig(process.env);

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: database.TURSO_DATABASE_URL,
    ...(database.TURSO_AUTH_TOKEN ? { authToken: database.TURSO_AUTH_TOKEN } : {})
  },
  strict: true,
  verbose: true
});
