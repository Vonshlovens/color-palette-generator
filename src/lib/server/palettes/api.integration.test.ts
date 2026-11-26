import { afterEach, describe, expect, it } from 'vitest';
import type { Database } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { createTestDatabase } from '$lib/server/db/test-database';
import { POST } from '../../../routes/api/palettes/+server';
import { DELETE, GET, PATCH } from '../../../routes/api/palettes/[slug]/+server';
import { getPaletteBySlug } from './queries';

type User = App.Locals['user'];

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
});

/** Calls a route handler the way SvelteKit would, with only the event fields it reads. */
function call(
  handler: (event: never) => Response | Promise<Response>,
  db: Database,
  user: User,
  init: { slug?: string; method?: string; body?: unknown }
) {
  const request = new Request('http://localhost/api/palettes', {
    method: init.method ?? 'GET',
    headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  });
  const event = { request, params: { slug: init.slug ?? '' }, locals: { db, user }, url: new URL(request.url) };
  return handler(event as never);
}

async function setup() {
  const { database: db, cleanup } = await createTestDatabase();
  cleanups.push(cleanup);
  const users = await db
    .insert(schema.user)
    .values(
      ['creator', 'stranger', 'owner'].map((name) => ({
        id: name,
        name,
        email: `${name}@example.com`,
        approvalStatus: 'approved' as const
      }))
    )
    .returning();
  const [creator, stranger, owner] = users.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    isOwner: row.id === 'owner'
  }));

  const response = await call(POST, db, creator, {
    method: 'POST',
    body: { name: 'Seven freeform', harmony: 'freeform', colors: Array.from({ length: 7 }, (_, i) => ({ h: i * 40, s: 50, l: 50 })) }
  });
  expect(response.status).toBe(201);
  const { palette } = (await response.json()) as { palette: { slug: string; canManage: boolean; colors: unknown[] } };
  expect(palette.canManage).toBe(true);
  expect(palette.colors).toHaveLength(7);
  return { db, creator, stranger, owner, slug: palette.slug };
}

describe('palette rename and delete endpoints', () => {
  it('lets only the creator or the owner rename', async () => {
    const { db, creator, stranger, owner, slug } = await setup();
    const rename = (user: User, name: unknown) => call(PATCH, db, user, { slug, method: 'PATCH', body: { name } });

    expect((await rename(null, 'Anon')).status).toBe(401);
    expect((await rename(stranger, 'Stranger')).status).toBe(403);
    expect((await getPaletteBySlug(db, slug))?.name).toBe('Seven freeform');

    expect((await rename(creator, '   ')).status).toBe(400);
    const byCreator = await rename(creator, '  Monochromatic blues  ');
    expect(byCreator.status).toBe(200);
    expect(((await byCreator.json()) as { palette: { name: string } }).palette.name).toBe('Monochromatic blues');

    expect((await rename(owner, 'Owner pick')).status).toBe(200);
    const stored = await getPaletteBySlug(db, slug);
    expect(stored?.name).toBe('Owner pick');
    expect(stored?.colors).toHaveLength(7);
  });

  it('reports canManage per viewer when reading', async () => {
    const { db, creator, stranger, slug } = await setup();
    const read = async (user: User) =>
      ((await (await call(GET, db, user, { slug })).json()) as { palette: { canManage: boolean } }).palette.canManage;
    expect(await read(creator)).toBe(true);
    expect(await read(stranger)).toBe(false);
    expect(await read(null)).toBe(false);
  });

  it('lets only the creator or the owner delete', async () => {
    const { db, creator, stranger, owner, slug } = await setup();
    const remove = (user: User, target = slug) => call(DELETE, db, user, { slug: target, method: 'DELETE' });

    expect((await remove(null)).status).toBe(401);
    expect((await remove(stranger)).status).toBe(403);
    expect(await getPaletteBySlug(db, slug)).toBeDefined();

    expect((await remove(owner)).status).toBe(204);
    expect(await getPaletteBySlug(db, slug)).toBeUndefined();
    expect((await remove(creator)).status).toBe(404);
    expect((await remove(creator, '../escape')).status).toBe(404);
  });
});
