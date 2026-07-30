import { json } from '@sveltejs/kit';
import { createPalette, listPalettes } from '$lib/server/palettes/queries';
import { toSavedPalette } from '$lib/server/palettes/mapping';
import { createPaletteSchema, listPalettesQuerySchema } from '$lib/server/palettes/validation';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const result = listPalettesQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!result.success) {
    return json(
      {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Pagination parameters are invalid',
          issues: result.error.issues.map((issue) => ({
            field: issue.path.map(String).join('.'),
            message: issue.message
          }))
        }
      },
      { status: 400 }
    );
  }

  try {
    const { palettes, hasMore } = await listPalettes(result.data);

    return json({
      palettes: palettes.map(toSavedPalette),
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

export const POST: RequestHandler = async ({ request }) => {
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
    return json(
      {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Palette data is invalid',
          issues: result.error.issues.map((issue) => ({
            field: issue.path.map(String).join('.'),
            message: issue.message
          }))
        }
      },
      { status: 400 }
    );
  }

  try {
    const palette = toSavedPalette(await createPalette(result.data));

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
