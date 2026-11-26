import { json } from '@sveltejs/kit';
import { createPalette, listPalettes } from '$lib/server/palettes/queries';
import { toSavedPalette } from '$lib/server/palettes/mapping';
import {
  createPaletteSchema,
  invalidRequest,
  listPalettesQuerySchema
} from '$lib/server/palettes/validation';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const result = listPalettesQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!result.success) {
    return json(invalidRequest('Pagination parameters are invalid', result.error), { status: 400 });
  }

  try {
    const { palettes, hasMore } = await listPalettes(locals.db, result.data);

    return json({
      palettes: palettes.map((record) => toSavedPalette(record, locals.user)),
      pagination: {
        limit: result.data.limit,
        offset: result.data.offset,
        hasMore
      }
    });
  } catch (error) {
    console.error('Failed to list palettes', error);
    return json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unable to load palettes' } },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  // Saving is the only public database write; hooks.server.ts sets `user` only for approved users.
  if (!locals.user) {
    return json(
      { error: { code: 'UNAUTHORIZED', message: 'Sign in with an approved account to save palettes' } },
      { status: 401 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const result = createPaletteSchema.safeParse(payload);

  if (!result.success) {
    return json(invalidRequest('Palette data is invalid', result.error), { status: 400 });
  }

  try {
    const palette = toSavedPalette(
      await createPalette(locals.db, { ...result.data, createdBy: locals.user.id }),
      locals.user
    );

    return json(
      { palette },
      {
        status: 201,
        headers: { location: `/palettes/${palette.slug}` }
      }
    );
  } catch (error) {
    console.error('Failed to save palette', error);
    return json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unable to save the palette' } },
      { status: 500 }
    );
  }
};
