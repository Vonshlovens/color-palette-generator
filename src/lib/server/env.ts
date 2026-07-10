import { env } from '$env/dynamic/private';
import { parseDatabaseConfig } from '$lib/database-config';

export const databaseConfig = parseDatabaseConfig(env);
