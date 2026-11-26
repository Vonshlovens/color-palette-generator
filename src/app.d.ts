/// <reference types="@sveltejs/kit" />
import type { D1Database } from '@cloudflare/workers-types';
import type { Database } from '$lib/server/db';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Database;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      /** Bindings declared in wrangler.jsonc. */
      env: {
        DB: D1Database;
      };
    }
  }
}

export {};
