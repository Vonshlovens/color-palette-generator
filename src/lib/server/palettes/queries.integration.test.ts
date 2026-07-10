import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as schema from '$lib/server/db/schema';
import { createPalette, getPaletteBySlug } from './queries';

const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

describe('palette queries', () => {
  it('creates and retrieves a palette through migrated libSQL storage', async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'palette-integration-'));
    const databasePath = join(temporaryDirectory, 'palette.db');
    const client = createClient({ url: `file:${databasePath}` });
    const database = drizzle(client, { schema });

    try {
      await migrate(database, { migrationsFolder });

      const created = await createPalette(
        {
          name: 'Integration Palette',
          hue: 275.5,
          saturation: 64,
          lightness: 42,
          harmony: 'split-complementary'
        },
        database
      );

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.slug).toMatch(/^[A-Za-z0-9_-]{12}$/);

      const retrieved = await getPaletteBySlug(created.slug, database);
      expect(retrieved).toEqual(created);
      expect(await getPaletteBySlug('DoesNotExist', database)).toBeUndefined();
    } finally {
      client.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
