import type { SavedPalette } from '$lib/types';
import type { PaletteRecord } from '$lib/server/db';

export function toSavedPalette(record: PaletteRecord): SavedPalette {
  return {
    slug: record.slug,
    name: record.name,
    hue: record.hue,
    saturation: record.saturation,
    lightness: record.lightness,
    harmony: record.harmony,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}
