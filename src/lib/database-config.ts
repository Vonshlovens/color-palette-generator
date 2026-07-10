import { z } from 'zod';

const databaseEnvSchema = z
  .object({
    TURSO_DATABASE_URL: z.string().trim().min(1).default('file:local.db'),
    TURSO_AUTH_TOKEN: z.string().trim().min(1).optional()
  })
  .superRefine((value, context) => {
    const isLocal = value.TURSO_DATABASE_URL.startsWith('file:');

    if (!isLocal && !value.TURSO_AUTH_TOKEN) {
      context.addIssue({
        code: 'custom',
        path: ['TURSO_AUTH_TOKEN'],
        message: 'TURSO_AUTH_TOKEN is required for remote libSQL databases'
      });
    }
  });

export type DatabaseConfig = z.infer<typeof databaseEnvSchema>;

export function parseDatabaseConfig(
  environment: Record<string, string | undefined>
): DatabaseConfig {
  return databaseEnvSchema.parse({
    TURSO_DATABASE_URL: environment.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: environment.TURSO_AUTH_TOKEN || undefined
  });
}
