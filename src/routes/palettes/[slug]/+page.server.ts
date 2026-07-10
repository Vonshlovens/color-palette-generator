import { error } from '@sveltejs/kit';
import { getPaletteBySlug } from '$lib/server/palettes/queries';
import { toSavedPalette } from '$lib/server/palettes/mapping';
import { paletteSlugSchema } from '$lib/server/palettes/validation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  if (!paletteSlugSchema.safeParse(params.slug).success) {
    error(404, 'Palette not found');
  }

  const record = await getPaletteBySlug(params.slug);

  if (!record) {
    error(404, 'Palette not found');
  }

  return { palette: toSavedPalette(record) };
};
