import { desc, eq } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import { palettes, type PaletteRecord } from '$lib/server/db/schema';
import type { CreatePaletteInput } from './validation';

const MAX_SLUG_ATTEMPTS = 3;

/** 9 random bytes encode to exactly 12 unpadded base64url characters. */
function createSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_');
}

export async function createPalette(
  database: Database,
  input: CreatePaletteInput & { createdBy: string | null }
): Promise<PaletteRecord> {
  const now = new Date();

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const [created] = await database
      .insert(palettes)
      .values({
        id: crypto.randomUUID(),
        slug: createSlug(),
        name: input.name,
        hue: input.hue,
        saturation: input.saturation,
        lightness: input.lightness,
        harmony: input.harmony,
        colors: input.colors,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoNothing({ target: palettes.slug })
      .returning();

    if (created) return created;
  }

  throw new Error('Unable to allocate a unique palette identifier');
}

export interface ListPalettesOptions {
  limit: number;
  offset: number;
}

export interface ListPalettesResult {
  palettes: PaletteRecord[];
  hasMore: boolean;
}

export async function listPalettes(
  database: Database,
  { limit, offset }: ListPalettesOptions
): Promise<ListPalettesResult> {
  // Fetch one extra row to determine whether another page exists.
  const rows = await database.query.palettes.findMany({
    orderBy: [desc(palettes.createdAt), desc(palettes.id)],
    limit: limit + 1,
    offset
  });

  return {
    palettes: rows.slice(0, limit),
    hasMore: rows.length > limit
  };
}

export async function getPaletteBySlug(
  database: Database,
  slug: string
): Promise<PaletteRecord | undefined> {
  return database.query.palettes.findFirst({
    where: eq(palettes.slug, slug)
  });
}

export async function renamePalette(
  database: Database,
  slug: string,
  name: string
): Promise<PaletteRecord | undefined> {
  const [updated] = await database
    .update(palettes)
    .set({ name, updatedAt: new Date() })
    .where(eq(palettes.slug, slug))
    .returning();
  return updated;
}

export async function deletePalette(database: Database, slug: string): Promise<boolean> {
  const deleted = await database
    .delete(palettes)
    .where(eq(palettes.slug, slug))
    .returning({ id: palettes.id });
  return deleted.length > 0;
}
