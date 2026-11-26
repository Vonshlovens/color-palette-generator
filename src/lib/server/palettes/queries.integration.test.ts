import type { D1Database } from '@cloudflare/workers-types';
import { migrate } from 'drizzle-orm/d1/migrator';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { createDb, type Database } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { createPalette, getPaletteBySlug, listPalettes } from './queries';

const configPath = fileURLToPath(new URL('../../../../wrangler.jsonc', import.meta.url));
const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

interface TestDatabase {
  database: Database;
  cleanup: () => Promise<void>;
}

/** A fresh in-memory local D1 database (workerd's SQLite) with all migrations applied. */
async function createTestDatabase(): Promise<TestDatabase> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath, persist: false });
  const database = createDb(proxy.env.DB);
  await migrate(database, { migrationsFolder });

  return { database, cleanup: () => proxy.dispose() };
}

describe('palette queries', () => {
  it('creates and retrieves a palette through migrated D1 storage', async () => {
    const { database, cleanup } = await createTestDatabase();

    try {
      const created = await createPalette(database, {
        name: 'Integration Palette',
        hue: 275.5,
        saturation: 64,
        lightness: 42,
        harmony: 'split-complementary'
      });

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.slug).toMatch(/^[A-Za-z0-9_-]{12}$/);

      const retrieved = await getPaletteBySlug(database, created.slug);
      expect(retrieved).toEqual(created);
      expect(await getPaletteBySlug(database, 'DoesNotExist')).toBeUndefined();
    } finally {
      await cleanup();
    }
  });

  it('lists palettes newest first with limit/offset pagination', async () => {
    const { database, cleanup } = await createTestDatabase();

    try {
      const base = Date.parse('2026-01-01T00:00:00.000Z');
      for (let index = 0; index < 5; index += 1) {
        const timestamp = new Date(base + index * 1000);
        await database.insert(schema.palettes).values({
          id: crypto.randomUUID(),
          slug: `list-slug-${index}00`,
          name: `Palette ${index}`,
          hue: index * 20,
          saturation: 60,
          lightness: 50,
          harmony: 'triadic',
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }

      const firstPage = await listPalettes(database, { limit: 2, offset: 0 });
      expect(firstPage.palettes.map((palette) => palette.name)).toEqual([
        'Palette 4',
        'Palette 3'
      ]);
      expect(firstPage.hasMore).toBe(true);

      const lastPage = await listPalettes(database, { limit: 2, offset: 4 });
      expect(lastPage.palettes.map((palette) => palette.name)).toEqual(['Palette 0']);
      expect(lastPage.hasMore).toBe(false);

      const beyond = await listPalettes(database, { limit: 2, offset: 10 });
      expect(beyond.palettes).toEqual([]);
      expect(beyond.hasMore).toBe(false);
    } finally {
      await cleanup();
    }
  });
});
