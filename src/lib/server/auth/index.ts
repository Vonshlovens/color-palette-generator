import type { RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import type { Database } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';
import {
  claimSignInEmailSlot,
  ensureOwner,
  findUserByEmail,
  findUserById,
  hasApprovedAccess,
  isOwnerEmail,
  normalizeEmail
} from './access';
import type { AuthConfig } from './config';
import { createEmailSender, magicLinkEmail, type SendEmail } from './email';

export const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;
const SESSION_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;

export interface CreateAuthOptions {
  /** Overrides email delivery, e.g. to capture links in tests. */
  sendEmail?: SendEmail;
  /** SvelteKit's `getRequestEvent`; lets server-side `auth.api` calls set cookies. */
  getRequestEvent?: () => RequestEvent;
}

/**
 * Builds a Better Auth instance for one request. It holds no module-level database state:
 * hooks.server.ts passes the per-request D1 database built from `platform.env.DB`.
 *
 * Sign-in is magic-link only and owner-approved:
 * - Magic links never create accounts (`disableSignUp`). Accounts come from access requests,
 *   which start `pending`, or from OWNER_EMAIL, which is created approved on first sign-in.
 * - A sign-in request for an email without approved access returns the same response as a real
 *   one but sends no email and writes nothing, so it cannot be used to spam inboxes or the DB.
 * - Sessions are only created for approved users, so a link sent before a revoke cannot be used.
 *
 * To add OAuth later, add `socialProviders`; new OAuth users are created `pending` by the user
 * create hook below and appear in Approvals, and the session hook keeps them signed out until
 * the owner approves them.
 */
export function createAuth(db: Database, config: AuthConfig, options: CreateAuthOptions = {}) {
  const sendEmail = options.sendEmail ?? createEmailSender(config.email, config.logEmails);
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user, session, account, verification }
    }),
    user: {
      additionalFields: {
        approvalStatus: { type: 'string', required: false, input: false, defaultValue: 'pending' }
      }
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: 24 * 60 * 60
    },
    // The default in-memory limiter is per isolate and costs no database reads or writes.
    rateLimit: { enabled: !config.dev, storage: 'memory' },
    // Cloudflare sets cf-connecting-ip and overwrites any client value, so rate limits are per
    // visitor instead of one shared bucket. x-forwarded-for is client-controlled on Workers.
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    plugins: [
      magicLink({
        disableSignUp: true,
        expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
        storeToken: 'hashed',
        sendMagicLink: async ({ email, url }) => {
          await sendEmail(
            magicLinkEmail(normalizeEmail(email), url, MAGIC_LINK_EXPIRES_IN_SECONDS / 60)
          );
        }
      }),
      // Must stay last so it sees the cookies set by the other plugins.
      ...(options.getRequestEvent ? [sveltekitCookies(options.getRequestEvent)] : [])
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/magic-link') return;

        const email = normalizeEmail(String(ctx.body?.email ?? ''));
        let existing = email ? await findUserByEmail(db, email) : undefined;
        if (
          isOwnerEmail(email, config.ownerEmail) &&
          (!existing || existing.approvalStatus !== 'approved')
        ) {
          existing = await ensureOwner(db, email);
        }

        const allowed =
          existing !== undefined &&
          hasApprovedAccess(existing, config.ownerEmail) &&
          (await claimSignInEmailSlot(db, email));

        // Identical response either way, so the endpoint does not reveal who has access.
        if (!allowed) return ctx.json({ status: true });
      })
    },
    databaseHooks: {
      user: {
        create: {
          before: async (data) => ({
            data: {
              ...data,
              approvalStatus: isOwnerEmail(data.email, config.ownerEmail) ? 'approved' : 'pending'
            }
          })
        }
      },
      session: {
        create: {
          before: async (data) => {
            const sessionUser = await findUserById(db, data.userId);
            return Boolean(sessionUser && hasApprovedAccess(sessionUser, config.ownerEmail));
          }
        }
      }
    }
  });
}

export type Auth = ReturnType<typeof createAuth>;
