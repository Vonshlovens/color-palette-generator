import type { RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import type { Database } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';
import {
  claimSignInEmailSlot,
  countPendingRequests,
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

/**
 * Codes for OAuth sign-ins that end without a session. Better Auth appends them to the
 * errorCallbackURL as `?error=`; /sign-in turns them into messages.
 */
export const OAUTH_ACCESS_ERRORS = {
  /** The user exists (new or older) and waits for the owner's approval. */
  pending: 'access_pending',
  /** The owner rejected or revoked the user. (GitHub itself sends `access_denied` on cancel.) */
  denied: 'access_not_approved',
  /** A new user would exceed AUTH_MAX_PENDING_REQUESTS, so nothing was stored. */
  closed: 'access_requests_closed',
  /** The provider did not verify the email, so it cannot create or claim an account. */
  emailUnverified: 'oauth_email_unverified'
} as const;

const isOAuthCallback = (ctx: { path?: string } | null | undefined) =>
  ctx?.path?.startsWith('/callback/') ?? false;

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
 * GitHub sign-in is enabled when GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are both set, under the
 * same gate:
 * - A GitHub login whose email has no account creates a `pending` user (the user create hook),
 *   shown in Approvals, unless AUTH_MAX_PENDING_REQUESTS are already pending. Only Better Auth's
 *   OAuth callback creates users through the adapter, since magic links cannot sign up.
 * - The session hook refuses sessions to anyone not approved, and on the OAuth callback says why,
 *   so /sign-in can show "waiting for approval" instead of a generic error.
 * - A GitHub login joins an existing account automatically only when GitHub verified that same
 *   email. GitHub is deliberately not a trusted provider: trust would skip that check, letting
 *   anyone add an unverified copy of an existing email to a GitHub account and sign in as its owner.
 * - Signed-in users link GitHub explicitly (`linkSocial`) from /account. That may use a different
 *   GitHub email, because the link is bound to the signed-in user's own session.
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
    socialProviders: config.github
      ? { github: { clientId: config.github.clientId, clientSecret: config.github.clientSecret } }
      : {},
    account: {
      // OAuth state rides in an encrypted cookie, so clicking "Continue with GitHub" writes nothing
      // to D1.
      storeStateStrategy: 'cookie',
      accountLinking: {
        enabled: true,
        trustedProviders: [],
        // Lets a signed-in user link a GitHub login whose email differs from theirs.
        allowDifferentEmails: true,
        // Accounts here have no password: an email-only account (an access request) holds nothing
        // a GitHub login with that verified email could take over. Without this, approved people
        // who requested access by email could not sign in with GitHub until they used a magic link.
        requireLocalEmailVerified: false,
        // Approved users can always sign in with a magic link to their email, so GitHub can go.
        allowUnlinkingAll: true
      }
    },
    // OAuth failures Better Auth cannot attach to a flow (such as a stale state cookie) land on the
    // sign-in page instead of Better Auth's default error page.
    onAPIError: { errorURL: new URL('/sign-in', config.baseURL).toString() },
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
          // Runs only for OAuth sign-ups (see above).
          before: async (data) => {
            if (!data.emailVerified) {
              throw new APIError('FORBIDDEN', {
                code: OAUTH_ACCESS_ERRORS.emailUnverified,
                message: 'The provider has not verified this email address'
              });
            }
            const isOwner = isOwnerEmail(data.email, config.ownerEmail);
            if (!isOwner && (await countPendingRequests(db)) >= config.maxPendingRequests) {
              throw new APIError('TOO_MANY_REQUESTS', {
                code: OAUTH_ACCESS_ERRORS.closed,
                message: 'Access requests are paused'
              });
            }
            return { data: { ...data, approvalStatus: isOwner ? 'approved' : 'pending' } };
          }
        }
      },
      session: {
        create: {
          before: async (data, ctx) => {
            const sessionUser = await findUserById(db, data.userId);
            if (sessionUser && hasApprovedAccess(sessionUser, config.ownerEmail)) return true;
            if (sessionUser && isOAuthCallback(ctx)) {
              const pending = sessionUser.approvalStatus === 'pending';
              throw new APIError('FORBIDDEN', {
                code: pending ? OAUTH_ACCESS_ERRORS.pending : OAUTH_ACCESS_ERRORS.denied,
                message: pending ? 'Access is waiting for approval' : 'Access was not approved'
              });
            }
            return false;
          }
        }
      }
    }
  });
}

export type Auth = ReturnType<typeof createAuth>;
