import { json } from '@sveltejs/kit';
import { getPaletteBySlug } from '$lib/server/palettes/queries';
import { toSavedPalette } from '$lib/server/palettes/mapping';
import { paletteSlugSchema } from '$lib/server/palettes/validation';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  if (!paletteSlugSchema.safeParse(params.slug).success) {
    return json(
      { error: { code: 'NOT_FOUND', message: 'Palette not found' } },
      { status: 404 }
    );
  }

  try {
    const record = await getPaletteBySlug(params.slug);

    if (!record) {
      return json(
        { error: { code: 'NOT_FOUND', message: 'Palette not found' } },
        { status: 404 }
      );
    }

    return json({ palette: toSavedPalette(record) });
  } catch (error) {
    console.error('Failed to load palette', error);
    return json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unable to load the palette' } },
      { status: 500 }
    );
  }
};
