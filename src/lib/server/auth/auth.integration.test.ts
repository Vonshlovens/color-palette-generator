import type { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/d1/migrator';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { createDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { requestAccess, setApprovalStatus } from './access';
import { resolveAuthConfig } from './config';
import type { EmailMessage } from './email';
import { createAuth } from './index';

const configPath = fileURLToPath(new URL('../../../../wrangler.jsonc', import.meta.url));
const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));
const BASE_URL = 'http://localhost:5173';
const OWNER = 'eric@ericevans.dev';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
});

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

  return { db, auth, config, sent, requestLink, redeemLastLink, userByEmail };
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
