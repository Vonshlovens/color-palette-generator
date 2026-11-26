import type { Handle } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { getSessionCookie } from 'better-auth/cookies';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { createAuth } from '$lib/server/auth';
import { hasApprovedAccess, isOwnerEmail } from '$lib/server/auth/access';
import { resolveAuthConfig } from '$lib/server/auth/config';
import { createDb } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
  const env = event.platform?.env;
  if (!env?.DB) {
    throw new Error('The D1 binding "DB" is unavailable; run the app through Vite or Wrangler');
  }

  // D1 bindings, vars, and secrets are per request on Workers, so the database and the Better
  // Auth instance are built here rather than at module scope.
  event.locals.db = createDb(env.DB);
  const config = resolveAuthConfig(env, { dev, requestOrigin: event.url.origin });
  event.locals.authConfig = config;
  event.locals.auth = createAuth(event.locals.db, config, { getRequestEvent });
  event.locals.user = null;

  // Anonymous visitors carry no session cookie, so they cost no database reads.
  if (!building && getSessionCookie(event.request.headers)) {
    const result = await event.locals.auth.api.getSession({ headers: event.request.headers });
    if (result && hasApprovedAccess(result.user, config.ownerEmail)) {
      event.locals.user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isOwner: isOwnerEmail(result.user.email, config.ownerEmail)
      };
    }
  }

  return svelteKitHandler({ auth: event.locals.auth, event, resolve, building });
};
