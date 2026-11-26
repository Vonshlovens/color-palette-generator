import { error } from '@sveltejs/kit';
import { listPalettes } from '$lib/server/palettes/queries';
import { toSavedPalette } from '$lib/server/palettes/mapping';
import { PALETTE_LIST_DEFAULT_LIMIT } from '$lib/server/palettes/validation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const { palettes, hasMore } = await listPalettes(locals.db, {
      limit: PALETTE_LIST_DEFAULT_LIMIT,
      offset: 0
    });

    return {
      palettes: palettes.map((record) => toSavedPalette(record, locals.user)),
      hasMore,
      pageSize: PALETTE_LIST_DEFAULT_LIMIT
    };
  } catch (cause) {
    console.error('Failed to load the palette gallery', cause);
    error(503, 'Palette service is temporarily unavailable');
  }
};
