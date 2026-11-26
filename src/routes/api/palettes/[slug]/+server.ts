import { json } from '@sveltejs/kit';
import type { PaletteRecord } from '$lib/server/db';
import {
  deletePalette,
  getPaletteBySlug,
  renamePalette
} from '$lib/server/palettes/queries';
import { canManagePalette, toSavedPalette } from '$lib/server/palettes/mapping';
import {
  invalidRequest,
  paletteSlugSchema,
  renamePaletteSchema
} from '$lib/server/palettes/validation';
import type { RequestHandler } from './$types';

const notFound = () =>
  json({ error: { code: 'NOT_FOUND', message: 'Palette not found' } }, { status: 404 });

const internalError = (message: string) =>
  json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });

type Event = Parameters<RequestHandler>[0];

/**
 * Loads the palette for a rename or delete and checks that the signed-in user may change it:
 * its creator or the owner. Returns the record, or the error response to send.
 */
async function findManageable({ params, locals }: Event): Promise<PaletteRecord | Response> {
  if (!locals.user) {
    return json(
      { error: { code: 'UNAUTHORIZED', message: 'Sign in to change saved palettes' } },
      { status: 401 }
    );
  }
  if (!paletteSlugSchema.safeParse(params.slug).success) return notFound();

  const record = await getPaletteBySlug(locals.db, params.slug);
  if (!record) return notFound();
  if (!canManagePalette(record, locals.user)) {
    return json(
      { error: { code: 'FORBIDDEN', message: 'Only the person who saved this palette can change it' } },
      { status: 403 }
    );
  }
  return record;
}

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!paletteSlugSchema.safeParse(params.slug).success) return notFound();

  try {
    const record = await getPaletteBySlug(locals.db, params.slug);
    if (!record) return notFound();
    return json({ palette: toSavedPalette(record, locals.user) });
  } catch (error) {
    console.error('Failed to load palette', error);
    return internalError('Unable to load the palette');
  }
};

/** Rename a saved palette. Its colors never change; save again for a new version. */
export const PATCH: RequestHandler = async (event) => {
  let payload: unknown;
  try {
    payload = await event.request.json();
  } catch {
    return json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  try {
    const found = await findManageable(event);
    if (found instanceof Response) return found;

    const result = renamePaletteSchema.safeParse(payload);
    if (!result.success) {
      return json(invalidRequest('Palette name is invalid', result.error), { status: 400 });
    }

    const updated = await renamePalette(event.locals.db, found.slug, result.data.name);
    if (!updated) return notFound();
    return json({ palette: toSavedPalette(updated, event.locals.user) });
  } catch (error) {
    console.error('Failed to rename palette', error);
    return internalError('Unable to rename the palette');
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    const found = await findManageable(event);
    if (found instanceof Response) return found;

    if (!(await deletePalette(event.locals.db, found.slug))) return notFound();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete palette', error);
    return internalError('Unable to delete the palette');
  }
};
