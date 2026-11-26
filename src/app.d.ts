/// <reference types="@sveltejs/kit" />
import type { D1Database } from '@cloudflare/workers-types';
import type { Auth } from '$lib/server/auth';
import type { AuthConfig, AuthEnv } from '$lib/server/auth/config';
import type { Database } from '$lib/server/db';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Database;
      auth: Auth;
      authConfig: AuthConfig;
      /** The signed-in, approved user; null for anonymous visitors. */
      user: { id: string; email: string; name: string; isOwner: boolean } | null;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      /**
       * Bindings declared in wrangler.jsonc, plus vars and secrets (`.dev.vars` locally). AuthEnv
       * holds the auth settings, including GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.
       */
      env: AuthEnv & {
        DB: D1Database;
      };
    }
  }
}

export {};
