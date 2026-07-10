import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    await db.run(sql`select 1`);
    return json(
      { status: 'ok', app: 'ok', database: 'ok' },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch (error) {
    console.error('Database health check failed', error);
    return json(
      { status: 'unavailable', app: 'ok', database: 'unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
};
