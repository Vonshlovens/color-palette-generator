import type { Handle } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { getSessionCookie } from 'better-auth/cookies';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { createAuth } from '$lib/server/auth';
import { hasApprovedAccess, isOwnerEmail } from '$lib/server/auth/access';
import { resolveAuthConfig } from '$lib/server/auth/config';
import { db } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
  // On Cloudflare Workers, swap this for a per-request `drizzle(event.platform.env.DB, { schema })`.
  event.locals.db = db;
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
