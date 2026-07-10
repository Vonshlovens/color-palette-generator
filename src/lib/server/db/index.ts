import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { databaseConfig } from '$lib/server/env';
import * as schema from './schema';

const client = createClient({
  url: databaseConfig.TURSO_DATABASE_URL,
  ...(databaseConfig.TURSO_AUTH_TOKEN
    ? { authToken: databaseConfig.TURSO_AUTH_TOKEN }
    : {})
});

export const db = drizzle(client, { schema });

export { schema };
export type { NewPaletteRecord, PaletteRecord } from './schema';
