import { z } from 'zod';
import type { EmailEnv } from './email';

export const DEFAULT_OWNER_EMAIL = 'eric@ericevans.dev';
const DEV_SECRET = 'palette-studio-development-secret-not-for-production';

/** String settings read from `$env/dynamic/private` (Bun) or Worker vars and secrets (Cloudflare). */
export interface AuthEnv extends EmailEnv {
  [key: string]: string | undefined;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ORIGIN?: string;
  OWNER_EMAIL?: string;
  AUTH_MAX_PENDING_REQUESTS?: string;
}

export interface AuthConfig {
  secret: string;
  baseURL: string;
  ownerEmail: string;
  maxPendingRequests: number;
  dev: boolean;
  email: EmailEnv;
}

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const optionalString = z.preprocess(blankToUndefined, z.string().trim().optional());

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.preprocess(blankToUndefined, z.string().trim().min(32).optional()),
  BETTER_AUTH_URL: z.preprocess(blankToUndefined, z.url().optional()),
  ORIGIN: z.preprocess(blankToUndefined, z.url().optional()),
  OWNER_EMAIL: z.preprocess(blankToUndefined, z.email().default(DEFAULT_OWNER_EMAIL)),
  AUTH_MAX_PENDING_REQUESTS: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(0).max(1000).default(25)
  ),
  RESEND_API_KEY: optionalString,
  AUTH_EMAIL_FROM: optionalString
});

/**
 * Resolves auth settings from plain env strings without Node-only APIs, so the same code runs per
 * request on Bun and on Cloudflare Workers. Production requires a real secret and a fixed public
 * URL: sign-in links are never built from the request's Host header there.
 */
export function resolveAuthConfig(
  env: AuthEnv,
  { dev, requestOrigin }: { dev: boolean; requestOrigin?: string }
): AuthConfig {
  const parsed = authEnvSchema.parse({
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    ORIGIN: env.ORIGIN,
    OWNER_EMAIL: env.OWNER_EMAIL,
    AUTH_MAX_PENDING_REQUESTS: env.AUTH_MAX_PENDING_REQUESTS,
    RESEND_API_KEY: env.RESEND_API_KEY,
    AUTH_EMAIL_FROM: env.AUTH_EMAIL_FROM
  });

  const secret = parsed.BETTER_AUTH_SECRET ?? (dev ? DEV_SECRET : undefined);
  if (!secret) throw new Error('BETTER_AUTH_SECRET (at least 32 characters) is required in production');

  const baseURL = parsed.BETTER_AUTH_URL ?? parsed.ORIGIN ?? (dev ? requestOrigin : undefined);
  if (!baseURL) throw new Error('BETTER_AUTH_URL or ORIGIN is required in production');

  return {
    secret,
    baseURL,
    ownerEmail: parsed.OWNER_EMAIL.toLowerCase(),
    maxPendingRequests: parsed.AUTH_MAX_PENDING_REQUESTS,
    dev,
    email: { RESEND_API_KEY: parsed.RESEND_API_KEY, AUTH_EMAIL_FROM: parsed.AUTH_EMAIL_FROM }
  };
}
