import { migrate } from 'drizzle-orm/d1/migrator';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatePalette } from '$lib/color/harmonies';
import * as schema from '$lib/server/db/schema';
import { createTestDatabase, migrationsFolder } from '$lib/server/db/test-database';
import { toSavedPalette } from './mapping';
import { createPalette, deletePalette, getPaletteBySlug, listPalettes, renamePalette } from './queries';
import { createPaletteSchema } from './validation';

describe('palette queries', () => {
  it('creates and retrieves a palette through migrated D1 storage', async () => {
    const { database, cleanup } = await createTestDatabase();

    try {
      const [creator] = await database
        .insert(schema.user)
        .values({ id: crypto.randomUUID(), name: 'Creator', email: 'creator@example.com' })
        .returning();
      const created = await createPalette(database, {
        ...createPaletteSchema.parse({
          name: 'Integration Palette',
          hue: 275.5,
          saturation: 64,
          lightness: 42,
          harmony: 'split-complementary'
        }),
        createdBy: creator.id
      });

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.slug).toMatch(/^[A-Za-z0-9_-]{12}$/);

      const retrieved = await getPaletteBySlug(database, created.slug);
      expect(retrieved).toEqual(created);
      expect(retrieved?.createdBy).toBe(creator.id);
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

  it('stores the exact swatches, including ones the generator would not produce', async () => {
    const { database, cleanup } = await createTestDatabase();
    try {
      // Eric's case: a monochromatic seed whose hue drifted to green while locked blues stayed.
      const blues = [
        { h: 214, s: 90, l: 25 },
        { h: 214, s: 85, l: 40 },
        { h: 210, s: 100, l: 50 },
        { h: 214, s: 70, l: 65 },
        { h: 214, s: 50, l: 80 }
      ];
      const created = await createPalette(database, {
        ...createPaletteSchema.parse({
          name: 'Monochromatic blues',
          hue: 99,
          saturation: 93,
          lightness: 50,
          harmony: 'monochromatic',
          colors: blues
        }),
        createdBy: null
      });
      const saved = toSavedPalette((await getPaletteBySlug(database, created.slug))!);
      expect(saved.colors).toEqual(blues);

      const freeform = await createPalette(database, {
        ...createPaletteSchema.parse({
          name: 'Seven',
          harmony: 'freeform',
          colors: Array.from({ length: 7 }, (_, i) => ({ h: i * 50, s: 60, l: 10 + i * 10 }))
        }),
        createdBy: null
      });
      const reread = toSavedPalette((await getPaletteBySlug(database, freeform.slug))!);
      expect(reread.harmony).toBe('freeform');
      expect(reread.colors).toHaveLength(7);
      expect(reread.colors[6]).toEqual({ h: 300, s: 60, l: 70 });
    } finally {
      await cleanup();
    }
  });

  it('rejects rows that break the colors constraints', async () => {
    const { database, cleanup } = await createTestDatabase();
    try {
      const row = (overrides: Partial<typeof schema.palettes.$inferInsert>) => ({
        id: crypto.randomUUID(),
        slug: `slug-${crypto.randomUUID().slice(0, 8)}`,
        name: 'Bad',
        hue: 0,
        saturation: 0,
        lightness: 0,
        harmony: 'freeform' as const,
        ...overrides
      });
      await expect(database.insert(schema.palettes).values(row({ colors: null }))).rejects.toThrow();
      await expect(
        database.insert(schema.palettes).values(row({ colors: Array(8).fill({ h: 0, s: 0, l: 0 }) }))
      ).rejects.toThrow();
      await expect(database.insert(schema.palettes).values(row({ colors: [] }))).rejects.toThrow();
      await database.insert(schema.palettes).values(row({ colors: [{ h: 1, s: 2, l: 3 }] }));
    } finally {
      await cleanup();
    }
  });

  it('renames and deletes by slug', async () => {
    const { database, cleanup } = await createTestDatabase();
    try {
      const created = await createPalette(database, {
        ...createPaletteSchema.parse({ name: 'Before', harmony: 'freeform', colors: [{ h: 1, s: 2, l: 3 }] }),
        createdBy: null
      });
      const renamed = await renamePalette(database, created.slug, 'After');
      expect(renamed?.name).toBe('After');
      expect(renamed?.colors).toEqual([{ h: 1, s: 2, l: 3 }]);
      expect(renamed!.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
      expect(await renamePalette(database, 'missing-slug', 'x')).toBeUndefined();

      expect(await deletePalette(database, created.slug)).toBe(true);
      expect(await getPaletteBySlug(database, created.slug)).toBeUndefined();
      expect(await deletePalette(database, created.slug)).toBe(false);
    } finally {
      await cleanup();
    }
  });

  it('keeps rows saved before the colors column and derives their swatches', async () => {
    // Apply only the migrations that existed before 0003, as remote D1 had them.
    const journal = JSON.parse(readFileSync(join(migrationsFolder, 'meta/_journal.json'), 'utf8'));
    const before = mkdtempSync(join(tmpdir(), 'palette-migrations-'));
    cpSync(migrationsFolder, before, { recursive: true });
    const legacyEntries = journal.entries.filter((entry: { tag: string }) => entry.tag < '0003');
    writeFileSync(join(before, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: legacyEntries }));

    const { database, d1, cleanup } = await createTestDatabase(before);
    try {
      await d1
        .prepare(
          `insert into palettes (id, slug, name, hue, saturation, lightness, harmony) values (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind('legacy-id', 'KwD_j4iW2x03', 'Nice Monochromatic Blues!', 99, 93, 50, 'monochromatic')
        .run();

      await migrate(database, { migrationsFolder });

      const record = await getPaletteBySlug(database, 'KwD_j4iW2x03');
      expect(record).toMatchObject({ name: 'Nice Monochromatic Blues!', hue: 99, colors: null });
      expect(toSavedPalette(record!).colors).toEqual(
        generatePalette({ h: 99, s: 93, l: 50 }, 'monochromatic').map((color) => color.hsl)
      );
    } finally {
      await cleanup();
      rmSync(before, { recursive: true, force: true });
    }
  });
});
