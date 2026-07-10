import { randomBytes, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { palettes, type PaletteRecord } from '$lib/server/db/schema';
import type { CreatePaletteInput } from './validation';

const MAX_SLUG_ATTEMPTS = 3;

function createSlug(): string {
  return randomBytes(9).toString('base64url');
}

export async function createPalette(input: CreatePaletteInput): Promise<PaletteRecord> {
  const now = new Date();

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const [created] = await db
      .insert(palettes)
      .values({
        id: randomUUID(),
        slug: createSlug(),
        name: input.name,
        hue: input.hue,
        saturation: input.saturation,
        lightness: input.lightness,
        harmony: input.harmony,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoNothing()
      .returning();

    if (created) return created;
  }

  throw new Error('Unable to allocate a unique palette identifier');
}

export async function getPaletteBySlug(slug: string): Promise<PaletteRecord | undefined> {
  return db.query.palettes.findFirst({
    where: eq(palettes.slug, slug)
  });
}
