import { z } from 'zod';
import type { EmailEnv } from './email';

export const DEFAULT_OWNER_EMAIL = 'eric@ericevans.dev';
const DEV_SECRET = 'palette-studio-development-secret-not-for-production';

/** Worker vars and secrets from `event.platform.env` (`.dev.vars` under local Wrangler). */
export interface AuthEnv extends EmailEnv {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  OWNER_EMAIL?: string;
  AUTH_MAX_PENDING_REQUESTS?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export interface AuthConfig {
  secret: string;
  baseURL: string;
  ownerEmail: string;
  maxPendingRequests: number;
  /** GitHub OAuth credentials; null unless both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set. */
  github: GitHubOAuthConfig | null;
  dev: boolean;
  /** Print emails to the console when no RESEND_API_KEY is set: `vite dev` or a localhost URL. */
  logEmails: boolean;
  email: EmailEnv;
}

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const optionalString = z.preprocess(blankToUndefined, z.string().trim().optional());

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.preprocess(blankToUndefined, z.string().trim().min(32).optional()),
  BETTER_AUTH_URL: z.preprocess(blankToUndefined, z.url().optional()),
  OWNER_EMAIL: z.preprocess(blankToUndefined, z.email().default(DEFAULT_OWNER_EMAIL)),
  AUTH_MAX_PENDING_REQUESTS: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(0).max(1000).default(25)
  ),
  RESEND_API_KEY: optionalString,
  AUTH_EMAIL_FROM: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString
});

/**
 * Resolves auth settings from plain env strings without Node-only APIs, so the same code runs per
 * request on Cloudflare Workers. Production requires a real secret and a fixed public
 * URL: sign-in links are never built from the request's Host header there.
 */
export function resolveAuthConfig(
  env: AuthEnv,
  { dev, requestOrigin }: { dev: boolean; requestOrigin?: string }
): AuthConfig {
  const parsed = authEnvSchema.parse({
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    OWNER_EMAIL: env.OWNER_EMAIL,
    AUTH_MAX_PENDING_REQUESTS: env.AUTH_MAX_PENDING_REQUESTS,
    RESEND_API_KEY: env.RESEND_API_KEY,
    AUTH_EMAIL_FROM: env.AUTH_EMAIL_FROM,
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET
  });

  const secret = parsed.BETTER_AUTH_SECRET ?? (dev ? DEV_SECRET : undefined);
  if (!secret) throw new Error('BETTER_AUTH_SECRET (at least 32 characters) is required in production');

  // `vite dev` also loads the production BETTER_AUTH_URL from wrangler.jsonc vars, so it links to
  // the local server instead.
  const baseURL = (dev ? requestOrigin : undefined) ?? parsed.BETTER_AUTH_URL;
  if (!baseURL) throw new Error('BETTER_AUTH_URL is required in production');
  const { hostname } = new URL(baseURL);

  return {
    secret,
    baseURL,
    ownerEmail: parsed.OWNER_EMAIL.toLowerCase(),
    maxPendingRequests: parsed.AUTH_MAX_PENDING_REQUESTS,
    github:
      parsed.GITHUB_CLIENT_ID && parsed.GITHUB_CLIENT_SECRET
        ? { clientId: parsed.GITHUB_CLIENT_ID, clientSecret: parsed.GITHUB_CLIENT_SECRET }
        : null,
    dev,
    logEmails: dev || hostname === 'localhost' || hostname === '127.0.0.1',
    email: { RESEND_API_KEY: parsed.RESEND_API_KEY, AUTH_EMAIL_FROM: parsed.AUTH_EMAIL_FROM }
  };
}
