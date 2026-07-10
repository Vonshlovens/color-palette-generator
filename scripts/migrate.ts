import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { parseDatabaseConfig } from '../src/lib/database-config';

const database = parseDatabaseConfig(process.env);
const client = createClient({
  url: database.TURSO_DATABASE_URL,
  ...(database.TURSO_AUTH_TOKEN ? { authToken: database.TURSO_AUTH_TOKEN } : {})
});
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.info('Database migrations are up to date.');
} finally {
  client.close();
}
