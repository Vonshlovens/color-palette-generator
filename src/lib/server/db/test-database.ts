import type { D1Database } from '@cloudflare/workers-types';
import { migrate } from 'drizzle-orm/d1/migrator';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';
import { createDb, type Database } from './index';

const configPath = fileURLToPath(new URL('../../../../wrangler.jsonc', import.meta.url));
export const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

export interface TestDatabase {
  database: Database;
  d1: D1Database;
  cleanup: () => Promise<void>;
}

/**
 * A fresh in-memory local D1 database (workerd's SQLite), for integration tests. Applies the
 * migrations in `folder` (all of them by default); pass `null` to apply none.
 */
export async function createTestDatabase(folder: string | null = migrationsFolder): Promise<TestDatabase> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath, persist: false });
  const database = createDb(proxy.env.DB);
  if (folder) await migrate(database, { migrationsFolder: folder });
  return { database, d1: proxy.env.DB, cleanup: () => proxy.dispose() };
}
