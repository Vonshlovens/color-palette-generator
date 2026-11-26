import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { databaseConfig } from '$lib/server/env';
import * as schema from './schema';

/**
 * Any async Drizzle SQLite database with this schema: libSQL/local SQLite today, Cloudflare D1
 * (`drizzle-orm/d1`) in production. Server code takes this type instead of a concrete driver.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDatabase = BaseSQLiteDatabase<'async', any, typeof schema>;

const client = createClient({
  url: databaseConfig.TURSO_DATABASE_URL,
  ...(databaseConfig.TURSO_AUTH_TOKEN
    ? { authToken: databaseConfig.TURSO_AUTH_TOKEN }
    : {})
});

export const db: AppDatabase = drizzle(client, { schema });

export { schema };
export type { NewPaletteRecord, PaletteRecord, UserRecord } from './schema';
