import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as schema from '$lib/server/db/schema';
import { createPalette, getPaletteBySlug, listPalettes } from './queries';

const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

interface TestDatabase {
  database: LibSQLDatabase<typeof schema>;
  client: Client;
  cleanup: () => Promise<void>;
}

async function createTestDatabase(): Promise<TestDatabase> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'palette-integration-'));
  const client = createClient({ url: `file:${join(temporaryDirectory, 'palette.db')}` });
  const database = drizzle(client, { schema });
  await migrate(database, { migrationsFolder });

  return {
    database,
    client,
    cleanup: async () => {
      client.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  };
}

describe('palette queries', () => {
  it('creates and retrieves a palette through migrated libSQL storage', async () => {
    const { database, cleanup } = await createTestDatabase();

    try {
      const created = await createPalette(
        {
          name: 'Integration Palette',
          hue: 275.5,
          saturation: 64,
          lightness: 42,
          harmony: 'split-complementary',
          lockedSwatches: [{ index: 2, h: 35, s: 70, l: 55 }]
        },
        database
      );

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.slug).toMatch(/^[A-Za-z0-9_-]{12}$/);
      expect(created.lockedSwatches).toEqual([{ index: 2, h: 35, s: 70, l: 55 }]);

      const retrieved = await getPaletteBySlug(created.slug, database);
      expect(retrieved).toEqual(created);
      expect(await getPaletteBySlug('DoesNotExist', database)).toBeUndefined();
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
          id: randomUUID(),
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

      const firstPage = await listPalettes({ limit: 2, offset: 0 }, database);
      expect(firstPage.palettes.map((palette) => palette.name)).toEqual([
        'Palette 4',
        'Palette 3'
      ]);
      expect(firstPage.hasMore).toBe(true);

      const lastPage = await listPalettes({ limit: 2, offset: 4 }, database);
      expect(lastPage.palettes.map((palette) => palette.name)).toEqual(['Palette 0']);
      expect(lastPage.hasMore).toBe(false);

      const beyond = await listPalettes({ limit: 2, offset: 10 }, database);
      expect(beyond.palettes).toEqual([]);
      expect(beyond.hasMore).toBe(false);
    } finally {
      await cleanup();
    }
  });
});
