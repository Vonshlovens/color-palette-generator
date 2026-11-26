import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// D1 is a per-request binding on Workers, so there is no module-level client. hooks.server.ts
// creates one instance per request and exposes it as `event.locals.db`.
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;

export { schema };
export type { NewPaletteRecord, PaletteRecord } from './schema';
