import type { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/d1/migrator';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { createDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { removeUnapprovedUser, requestAccess, setApprovalStatus } from './access';
import { resolveAuthConfig } from './config';
import type { EmailMessage } from './email';
import { createAuth, OAUTH_ACCESS_ERRORS } from './index';

const configPath = fileURLToPath(new URL('../../../../wrangler.jsonc', import.meta.url));
const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
const BASE_URL = 'http://localhost:5173';
const OWNER = 'eric@ericevans.dev';

const GITHUB_ENV = { GITHUB_CLIENT_ID: 'test-client-id', GITHUB_CLIENT_SECRET: 'test-client-secret' };

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
  vi.restoreAllMocks();
});

interface FakeGitHubUser {
  id: number;
  login: string;
  email: string;
  verified?: boolean;
}

/**
 * Answers Better Auth's GitHub calls (token exchange, /user, /user/emails) for the users given,
 * keyed by the authorization code GitHub would return for each of them.
 */
function fakeGitHub(users: Record<string, FakeGitHubUser>) {
  const realFetch = globalThis.fetch;
  const userFor = (headers: Headers) =>
    users[headers.get('authorization')?.replace(/^Bearer token-/i, '') ?? ''];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

    if (request.url === 'https://github.com/login/oauth/access_token') {
      const code = new URLSearchParams(await request.text()).get('code') ?? '';
      if (!users[code]) return json({ error: 'bad_verification_code' });
      return json({ access_token: `token-${code}`, token_type: 'bearer', scope: 'read:user,user:email' });
    }
    if (request.url === 'https://api.github.com/user') {
      const user = userFor(request.headers);
      if (!user) return json({ message: 'Bad credentials' }, 401);
      // Like GitHub, the profile email is null unless the user made one public.
      return json({ id: user.id, login: user.login, name: user.login, email: null, avatar_url: '' });
    }
    if (request.url === 'https://api.github.com/user/emails') {
      const user = userFor(request.headers);
      if (!user) return json({ message: 'Bad credentials' }, 401);
      return json([{ email: user.email, primary: true, verified: user.verified ?? true, visibility: null }]);
    }
    return realFetch(input, init);
  });
}

function cookiesFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .filter((cookie) => !cookie.endsWith('='))
    .join('; ');
}

async function setup(env: Record<string, string> = {}) {
  // A fresh in-memory local D1 database (workerd's SQLite) with all migrations applied.
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath, persist: false });
  cleanups.push(() => proxy.dispose());
  const db = createDb(proxy.env.DB);
  await migrate(db, { migrationsFolder });

  const config = resolveAuthConfig({ OWNER_EMAIL: OWNER, ...env }, { dev: true, requestOrigin: BASE_URL });
  const sent: EmailMessage[] = [];
  const auth = createAuth(db, config, { sendEmail: async (message) => void sent.push(message) });

  async function requestLink(email: string) {
    const response = await auth.handler(
      new Request(`${BASE_URL}/api/auth/sign-in/magic-link`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, callbackURL: '/', errorCallbackURL: '/sign-in' })
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });
  }

  /** Follows the link in the last email; returns the redirect target and session cookie. */
  async function redeemLastLink() {
    const url = sent.at(-1)?.text.match(/https?:\/\/\S+/)?.[0];
    expect(url).toBeDefined();
    const response = await auth.handler(new Request(url!));
    const cookie = response.headers.get('set-cookie') ?? '';
    return {
      location: response.headers.get('location') ?? '',
      sessionCookie: cookie.match(/better-auth\.session_token=[^;]+/)?.[0]
    };
  }

  async function userByEmail(email: string) {
    const [row] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    return row;
  }

  /**
   * Runs a GitHub OAuth round trip as the browser would: start it (sign-in, or link-social with a
   * session cookie), "authorize" at GitHub as the user with `code`, and follow the callback.
   */
  async function viaGitHub(code: string, options: { linkWith?: string } = {}) {
    const start = await auth.handler(
      new Request(`${BASE_URL}/api/auth/${options.linkWith ? 'link-social' : 'sign-in/social'}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: BASE_URL,
          ...(options.linkWith ? { cookie: options.linkWith } : {})
        },
        body: JSON.stringify(
          options.linkWith
            ? { provider: 'github', callbackURL: '/account?connected=github', errorCallbackURL: '/account' }
            : { provider: 'github', callbackURL: '/', errorCallbackURL: '/sign-in' }
        )
      })
    );
    expect(start.status).toBe(200);
    const { url } = (await start.json()) as { url: string };
    const authorize = new URL(url);
    expect(authorize.origin + authorize.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(authorize.searchParams.get('redirect_uri')).toBe(`${BASE_URL}/api/auth/callback/github`);

    const callback = new URL(`${BASE_URL}/api/auth/callback/github`);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', authorize.searchParams.get('state')!);
    const response = await auth.handler(
      new Request(callback, { headers: { cookie: [options.linkWith, cookiesFrom(start)].filter(Boolean).join('; ') } })
    );
    const location = response.headers.get('location') ?? '';
    const target = new URL(location, BASE_URL);
    return {
      location,
      /** Where the callback redirected, plus any `error` code (Better Auth adds a description). */
      landing: { path: target.pathname, error: target.searchParams.get('error') },
      sessionCookie: response.headers.get('set-cookie')?.match(/better-auth\.session_token=[^;]+/)?.[0]
    };
  }

  async function sessionUser(sessionCookie: string | undefined) {
    if (!sessionCookie) return null;
    return (await auth.api.getSession({ headers: new Headers({ cookie: sessionCookie }) }))?.user ?? null;
  }

  return { db, auth, config, sent, requestLink, redeemLastLink, userByEmail, viaGitHub, sessionUser };
}

describe('owner-approved magic link sign-in', () => {
  it('bootstraps OWNER_EMAIL as an approved user who can sign in', async () => {
    const { db, auth, sent, requestLink, redeemLastLink, userByEmail } = await setup();

    await requestLink('Eric@EricEvans.dev');
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(OWNER);
    expect((await userByEmail(OWNER))?.approvalStatus).toBe('approved');

    const { location, sessionCookie } = await redeemLastLink();
    expect(location).toBe(`${BASE_URL}/`);
    expect(sessionCookie).toBeDefined();

    const session = await auth.api.getSession({ headers: new Headers({ cookie: sessionCookie! }) });
    expect(session?.user.email).toBe(OWNER);

    // The Approvals actions cannot lock the owner out.
    expect(await setApprovalStatus(db, session!.user.id, 'revoked', OWNER)).toBeUndefined();
    expect((await userByEmail(OWNER))?.approvalStatus).toBe('approved');
  });

  it('sends nothing and stores nothing for an email without access', async () => {
    const { db, sent, requestLink } = await setup();

    await requestLink('stranger@example.com');

    expect(sent).toEqual([]);
    expect(await db.select().from(schema.user)).toEqual([]);
    expect(await db.select().from(schema.verification)).toEqual([]);
  });

  it('keeps access requests pending until the owner approves them', async () => {
    const { db, config, sent, requestLink, redeemLastLink, userByEmail } = await setup();

    expect(await requestAccess(db, { name: 'Ada', email: 'Ada@Example.com' }, config.maxPendingRequests))
      .toEqual({ outcome: 'created' });
    const pending = await userByEmail('ada@example.com');
    expect(pending?.approvalStatus).toBe('pending');

    await requestLink('ada@example.com');
    expect(sent).toEqual([]);

    await setApprovalStatus(db, pending!.id, 'approved', OWNER);
    await requestLink('ada@example.com');
    expect(sent.map((message) => message.to)).toEqual(['ada@example.com']);
    expect((await redeemLastLink()).sessionCookie).toBeDefined();
  });

  it('signs out revoked users and refuses links issued before the revoke', async () => {
    const { db, auth, config, sent, requestLink, redeemLastLink, userByEmail } = await setup();
    await requestAccess(db, { name: 'Bo', email: 'bo@example.com' }, config.maxPendingRequests);
    const bo = await userByEmail('bo@example.com');
    await setApprovalStatus(db, bo!.id, 'approved', OWNER);

    await requestLink('bo@example.com');
    const { sessionCookie } = await redeemLastLink();
    const headers = new Headers({ cookie: sessionCookie! });
    expect(await auth.api.getSession({ headers })).not.toBeNull();

    // A second link, requested after the cooldown, but redeemed only after the revoke.
    await db.delete(schema.verification).where(eq(schema.verification.identifier, 'sign-in-email-cooldown:bo@example.com'));
    await requestLink('bo@example.com');
    expect(sent).toHaveLength(2);

    await setApprovalStatus(db, bo!.id, 'revoked', OWNER);
    expect(await auth.api.getSession({ headers })).toBeNull();

    const late = await redeemLastLink();
    expect(late.sessionCookie).toBeUndefined();
    expect(late.location).toContain('/sign-in?error=');
    expect(await db.select().from(schema.session)).toEqual([]);
  });

  it('sends at most one email per address during the cooldown', async () => {
    const { sent, requestLink } = await setup();

    await requestLink(OWNER);
    await requestLink(OWNER);
    await requestLink(OWNER);

    expect(sent).toHaveLength(1);
  });

  it('stops accepting access requests once the pending queue is full', async () => {
    const { db, config } = await setup({ AUTH_MAX_PENDING_REQUESTS: '2' });

    for (const name of ['a', 'b']) {
      const result = await requestAccess(db, { name, email: `${name}@example.com` }, config.maxPendingRequests);
      expect(result.outcome).toBe('created');
    }
    expect(await requestAccess(db, { name: 'c', email: 'c@example.com' }, config.maxPendingRequests))
      .toEqual({ outcome: 'closed' });
    expect(await requestAccess(db, { name: 'a', email: 'A@example.com' }, config.maxPendingRequests))
      .toEqual({ outcome: 'exists', status: 'pending' });
  });
});

describe('GitHub sign-in', () => {
  const ERIC_GITHUB = { id: 1001, login: 'ericthered', email: 'ericthered005@gmail.com' };
  const ADA_GITHUB = { id: 2002, login: 'ada', email: 'ada@example.com' };
  const STRANGER_GITHUB = { id: 3003, login: 'stranger', email: 'stranger@example.com' };

  it('is enabled only when both GitHub credentials are set', async () => {
    const resolve = (env: Record<string, string>) =>
      resolveAuthConfig(env, { dev: true, requestOrigin: BASE_URL }).github;
    expect(resolve({})).toBeNull();
    expect(resolve({ GITHUB_CLIENT_ID: 'id' })).toBeNull();
    expect(resolve({ GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: '  ' })).toBeNull();
    expect(resolve(GITHUB_ENV)).toEqual({ clientId: 'test-client-id', clientSecret: 'test-client-secret' });

    const { auth } = await setup({ GITHUB_CLIENT_ID: 'id' });
    const response = await auth.handler(
      new Request(`${BASE_URL}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: BASE_URL },
        body: JSON.stringify({ provider: 'github', callbackURL: '/' })
      })
    );
    expect(response.status).toBe(404);
  });

  it('links GitHub to the magic-link owner account even with a different email', async () => {
    fakeGitHub({ eric: ERIC_GITHUB });
    const { db, auth, requestLink, redeemLastLink, viaGitHub, sessionUser } = await setup(GITHUB_ENV);

    await requestLink(OWNER);
    const { sessionCookie } = await redeemLastLink();
    const owner = await sessionUser(sessionCookie);
    expect(owner?.email).toBe(OWNER);

    const linked = await viaGitHub('eric', { linkWith: sessionCookie });
    expect(linked.location).toBe('/account?connected=github');
    expect(await db.select({ userId: schema.account.userId, providerId: schema.account.providerId, accountId: schema.account.accountId }).from(schema.account))
      .toEqual([{ userId: owner!.id, providerId: 'github', accountId: '1001' }]);

    // A later "Continue with GitHub" signs straight into the same account; no gmail user appears.
    const signedIn = await viaGitHub('eric');
    expect(signedIn.location).toBe('/');
    expect((await sessionUser(signedIn.sessionCookie))?.id).toBe(owner!.id);
    expect((await db.select().from(schema.user)).map((row) => row.email)).toEqual([OWNER]);

    // Disconnecting the only GitHub link is allowed: the email link still signs Eric in.
    const [github] = await db.select().from(schema.account);
    await auth.api.unlinkAccount({ body: { accountId: github.id }, headers: new Headers({ cookie: sessionCookie! }) });
    expect(await db.select().from(schema.account)).toEqual([]);
  });

  it('records a new GitHub user as pending without a session, then signs them in once approved', async () => {
    fakeGitHub({ stranger: STRANGER_GITHUB });
    const { db, viaGitHub, userByEmail } = await setup(GITHUB_ENV);

    const first = await viaGitHub('stranger');
    expect(first.sessionCookie).toBeUndefined();
    expect(first.landing).toEqual({ path: '/sign-in', error: OAUTH_ACCESS_ERRORS.pending });
    expect(await db.select().from(schema.session)).toEqual([]);
    const pending = await userByEmail('stranger@example.com');
    expect(pending).toMatchObject({ approvalStatus: 'pending', emailVerified: true, name: 'stranger' });

    // Trying again while pending creates nothing new.
    expect((await viaGitHub('stranger')).landing).toEqual({ path: '/sign-in', error: OAUTH_ACCESS_ERRORS.pending });
    expect(await db.select().from(schema.user)).toHaveLength(1);
    expect(await db.select().from(schema.account)).toHaveLength(1);

    await setApprovalStatus(db, pending!.id, 'approved', OWNER);
    const approved = await viaGitHub('stranger');
    expect(approved.location).toBe('/');
    expect(approved.sessionCookie).toBeDefined();

    await setApprovalStatus(db, pending!.id, 'revoked', OWNER);
    const revoked = await viaGitHub('stranger');
    expect(revoked.sessionCookie).toBeUndefined();
    expect(revoked.landing).toEqual({ path: '/sign-in', error: OAUTH_ACCESS_ERRORS.denied });
  });

  it('stores nothing for new GitHub users once the pending queue is full', async () => {
    fakeGitHub({ stranger: STRANGER_GITHUB, ada: ADA_GITHUB });
    const { db, config, viaGitHub } = await setup({ ...GITHUB_ENV, AUTH_MAX_PENDING_REQUESTS: '1' });

    await requestAccess(db, { name: 'Ada', email: 'ada@example.com' }, config.maxPendingRequests);

    const closed = await viaGitHub('stranger');
    expect(closed.sessionCookie).toBeUndefined();
    expect(closed.landing).toEqual({ path: '/sign-in', error: OAUTH_ACCESS_ERRORS.closed });
    expect((await db.select().from(schema.user)).map((row) => row.email)).toEqual(['ada@example.com']);
    expect(await db.select().from(schema.account)).toEqual([]);

    // An existing request is not a new one: Ada still hears she is waiting.
    expect((await viaGitHub('ada')).landing).toEqual({ path: '/sign-in', error: OAUTH_ACCESS_ERRORS.pending });
  });

  it('signs in approved users whose GitHub email matches, even before their first magic link', async () => {
    fakeGitHub({ ada: ADA_GITHUB });
    const { db, config, viaGitHub, sessionUser, userByEmail } = await setup(GITHUB_ENV);
    await requestAccess(db, { name: 'Ada', email: 'ada@example.com' }, config.maxPendingRequests);
    const ada = await userByEmail('ada@example.com');
    await setApprovalStatus(db, ada!.id, 'approved', OWNER);

    const { location, sessionCookie } = await viaGitHub('ada');
    expect(location).toBe('/');
    expect((await sessionUser(sessionCookie))?.id).toBe(ada!.id);
    expect(await db.select().from(schema.user)).toHaveLength(1);
  });

  it('never lets an unverified GitHub email claim or create an account', async () => {
    fakeGitHub({
      impostor: { id: 6666, login: 'impostor', email: OWNER, verified: false },
      unverified: { id: 7777, login: 'unverified', email: 'new@example.com', verified: false }
    });
    const { db, requestLink, redeemLastLink, viaGitHub, userByEmail } = await setup(GITHUB_ENV);
    await requestLink(OWNER);
    await redeemLastLink();

    const impostor = await viaGitHub('impostor');
    expect(impostor.sessionCookie).toBeUndefined();
    expect(impostor.landing).toEqual({ path: '/sign-in', error: 'account_not_linked' });

    const unverified = await viaGitHub('unverified');
    expect(unverified.sessionCookie).toBeUndefined();
    expect(unverified.landing).toEqual({ path: '/sign-in', error: OAUTH_ACCESS_ERRORS.emailUnverified });

    expect(await db.select().from(schema.account)).toEqual([]);
    expect(await userByEmail('new@example.com')).toBeUndefined();
    expect(await db.select().from(schema.session)).toHaveLength(1);
  });

  it('refuses to link a GitHub login owned by another user until the owner removes that user', async () => {
    fakeGitHub({ eric: ERIC_GITHUB });
    const { db, requestLink, redeemLastLink, viaGitHub, userByEmail } = await setup(GITHUB_ENV);

    // Signing in with GitHub before linking records a separate pending gmail user.
    await viaGitHub('eric');
    const duplicate = await userByEmail(ERIC_GITHUB.email);
    expect(duplicate?.approvalStatus).toBe('pending');

    await requestLink(OWNER);
    const { sessionCookie } = await redeemLastLink();
    const linked = await viaGitHub('eric', { linkWith: sessionCookie });
    expect(linked.landing).toEqual({ path: '/account', error: 'account_already_linked_to_different_user' });
    expect((await db.select().from(schema.account)).map((row) => row.userId)).toEqual([duplicate!.id]);

    // Removing the pending duplicate in Approvals frees the GitHub login for Eric's account.
    expect(await removeUnapprovedUser(db, duplicate!.id, OWNER)).toBeDefined();
    expect(await userByEmail(ERIC_GITHUB.email)).toBeUndefined();
    expect((await viaGitHub('eric', { linkWith: sessionCookie })).location).toBe('/account?connected=github');
    const owner = await userByEmail(OWNER);
    expect((await db.select().from(schema.account)).map((row) => row.userId)).toEqual([owner!.id]);
    // The owner account itself can never be removed.
    expect(await removeUnapprovedUser(db, owner!.id, OWNER)).toBeUndefined();
  });
});
