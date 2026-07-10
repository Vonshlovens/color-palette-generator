import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import { parseDatabaseConfig } from '../src/lib/database-config';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

// Keep relative file: URLs stable when this script is invoked outside the project root.
process.chdir(projectRoot);

const database = parseDatabaseConfig(process.env);
const client = createClient({
  url: database.TURSO_DATABASE_URL,
  ...(database.TURSO_AUTH_TOKEN ? { authToken: database.TURSO_AUTH_TOKEN } : {})
});
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder });
  console.info('Database migrations are up to date.');
} finally {
  client.close();
}
