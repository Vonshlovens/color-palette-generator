import { error } from '@sveltejs/kit';
import type { PaletteRecord } from '$lib/server/db';
import { getPaletteBySlug } from '$lib/server/palettes/queries';
import { toSavedPalette } from '$lib/server/palettes/mapping';
import { paletteSlugSchema } from '$lib/server/palettes/validation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  if (!paletteSlugSchema.safeParse(params.slug).success) {
    error(404, 'Palette not found');
  }

  let record: PaletteRecord | undefined;
  try {
    record = await getPaletteBySlug(params.slug);
  } catch (cause) {
    console.error('Failed to load saved palette', { slug: params.slug, cause });
    error(503, 'Palette service is temporarily unavailable');
  }

  if (!record) {
    error(404, 'Palette not found');
  }

  return { palette: toSavedPalette(record) };
};
