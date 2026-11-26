import type { Handle } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
  const d1 = event.platform?.env.DB;
  if (!d1) {
    throw new Error('The D1 binding "DB" is unavailable; run the app through Vite or Wrangler');
  }

  event.locals.db = createDb(d1);
  return resolve(event);
};
