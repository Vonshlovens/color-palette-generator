import { generatePalette } from '$lib/color/harmonies';
import type { HSL, SavedPalette } from '$lib/types';
import type { PaletteRecord } from '$lib/server/db';

/** The signed-in, approved user from `event.locals.user`, or null for anonymous visitors. */
export type PaletteViewer = Pick<NonNullable<App.Locals['user']>, 'id' | 'isOwner'> | null;

/** The palette's creator and the owner (OWNER_EMAIL) may rename and delete it. */
export function canManagePalette(record: Pick<PaletteRecord, 'createdBy'>, viewer: PaletteViewer): boolean {
  if (!viewer) return false;
  return viewer.isOwner || (record.createdBy !== null && record.createdBy === viewer.id);
}

/**
 * The exact saved swatches. Rows saved before the `colors` column existed hold only the
 * generator seed, so their swatches are generated from it.
 */
export function savedColors(record: PaletteRecord): HSL[] {
  if (record.colors) return record.colors;
  if (record.harmony === 'freeform') {
    return [{ h: record.hue, s: record.saturation, l: record.lightness }];
  }
  return generatePalette(
    { h: record.hue, s: record.saturation, l: record.lightness },
    record.harmony
  ).map((color) => color.hsl);
}

export function toSavedPalette(record: PaletteRecord, viewer: PaletteViewer = null): SavedPalette {
  return {
    slug: record.slug,
    name: record.name,
    hue: record.hue,
    saturation: record.saturation,
    lightness: record.lightness,
    harmony: record.harmony,
    colors: savedColors(record),
    canManage: canManagePalette(record, viewer),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}
